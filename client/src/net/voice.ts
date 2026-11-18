import { AV, distance2d, pickVideoPeers, volumeForDistance, type AvAccess, type Vec2 } from "@office/shared";
import { AV_MESSAGES, type PeerAv } from "../store/av";

/** Participante remoto tal como lo ve este módulo; `identity` es su id de sesión en la oficina. */
export interface VoicePeer {
  identity: string;
  micOn: boolean;
  camOn: boolean;
  setVolume(volume: number): void;
}

export interface VoiceRoomEvents {
  /** Alguien entró, salió, o encendió/apagó micrófono o cámara. */
  changed(): void;
  speakers(ids: string[]): void;
  /** La conexión de medios se cerró (por error o porque la cerramos). */
  disconnected(): void;
}

/** Lo que este módulo usa de una sala de LiveKit; permite probarlo sin servidor de medios. */
export interface VoiceRoom {
  connect(url: string, token: string): Promise<void>;
  disconnect(): Promise<void>;
  setMicrophoneEnabled(on: boolean): Promise<unknown>;
  setCameraEnabled(on: boolean): Promise<unknown>;
  /** Desbloquea la reproducción de audio del navegador; hay que llamarlo tras un gesto del usuario. */
  startAudio(): Promise<void>;
  participants(): VoicePeer[];
  listen(events: VoiceRoomEvents): void;
  /** Pinta en `el` la cámara de `identity` (o la propia con `null`); devuelve cómo despintarla. */
  attachVideo(identity: string | null, el: HTMLVideoElement): () => void;
}

export interface VoiceDeps {
  createRoom(): VoiceRoom;
  /** Posición propia tal como se ve en pantalla. */
  selfPose(): Vec2 | null;
  /** Posición interpolada de otro participante tal como se ve en pantalla. */
  peerPose(id: string, now: number): Vec2 | null;
  now(): number;
  every(ms: number, fn: () => void): () => void;
  log(message: string): void;
  error(message: string, cause: unknown): void;
}

/** A dónde van los cambios (el store de audio/video). */
export interface VoiceSink {
  reset(): void;
  connecting(): void;
  connected(): void;
  unavailable(text: string, now: number): void;
  setMic(on: boolean): void;
  setCam(on: boolean): void;
  deviceFailed(kind: "mic" | "cam", text: string, now: number): void;
  peers(peers: Record<string, PeerAv>): void;
  speakers(ids: string[]): void;
  visibleVideos(ids: string[]): void;
}

export interface Voice {
  start(access: AvAccess): Promise<void>;
  stop(): Promise<void>;
  toggleMic(): Promise<void>;
  toggleCam(): Promise<void>;
  /** Intenta desbloquear el audio (tras un gesto del usuario). */
  resumeAudio(): void;
  attachVideo(identity: string | null, el: HTMLVideoElement): () => void;
}

function deviceMessage(kind: "mic" | "cam", cause: unknown): string {
  const name = (cause as { name?: unknown } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") {
    return kind === "mic" ? AV_MESSAGES.micDenied : AV_MESSAGES.camDenied;
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") {
    return kind === "mic" ? AV_MESSAGES.micMissing : AV_MESSAGES.camMissing;
  }
  return kind === "mic" ? AV_MESSAGES.micFailed : AV_MESSAGES.camFailed;
}

/**
 * Canal de audio/video por proximidad (spec 005): se une con el acceso que da el servidor, conmuta micrófono
 * y cámara, y a 10 Hz ajusta el volumen de cada participante y elige los videos según la distancia.
 */
export function createVoice(deps: VoiceDeps, sink: VoiceSink): Voice {
  let room: VoiceRoom | null = null;
  /** Sesión de conexión vigente; cambia al salir, así una conexión a medias sabe que ya no vale. */
  let generation = 0;
  let connected = false;
  let mic = false;
  let cam = false;
  let stopTicker: (() => void) | null = null;
  const lastVolume = new Map<string, number>();

  const syncPeers = () => {
    if (!room) return;
    const peers: Record<string, PeerAv> = {};
    for (const p of room.participants()) peers[p.identity] = { micOn: p.micOn, camOn: p.camOn };
    for (const id of lastVolume.keys()) if (!(id in peers)) lastVolume.delete(id);
    sink.peers(peers);
  };

  const tick = () => {
    if (!room) return;
    const now = deps.now();
    const self = deps.selfPose();
    const withCamera: (Vec2 & { id: string })[] = [];
    for (const peer of room.participants()) {
      const pose = deps.peerPose(peer.identity, now);
      const volume = self && pose ? volumeForDistance(distance2d(self, pose)) : 0;
      if (lastVolume.get(peer.identity) !== volume) {
        peer.setVolume(volume);
        lastVolume.set(peer.identity, volume);
      }
      if (peer.camOn && pose) withCamera.push({ id: peer.identity, ...pose });
    }
    sink.visibleVideos(self ? pickVideoPeers(self, withCamera) : []);
  };

  const teardown = () => {
    stopTicker?.();
    stopTicker = null;
    connected = false;
    mic = false;
    cam = false;
    lastVolume.clear();
  };

  return {
    async start(access) {
      const mine = ++generation;
      if (!access.ok) {
        deps.log(`[voz] Audio/video no disponible (${access.reason})`);
        sink.unavailable(AV_MESSAGES.unavailable, deps.now());
        return;
      }
      const current = deps.createRoom();
      room = current;
      sink.connecting();
      current.listen({
        changed: () => {
          if (room === current) syncPeers();
        },
        speakers: (ids) => {
          if (room === current) sink.speakers(ids);
        },
        disconnected: () => {
          if (room !== current || !connected) return;
          deps.log("[voz] Se perdió la conexión de audio/video");
          teardown();
          room = null;
          sink.unavailable(AV_MESSAGES.lost, deps.now());
        },
      });
      try {
        await current.connect(access.url, access.token);
      } catch (cause) {
        if (mine !== generation) return;
        deps.error("[voz] No se pudo conectar con el servicio de audio/video", cause);
        room = null;
        sink.unavailable(AV_MESSAGES.unavailable, deps.now());
        return;
      }
      if (mine !== generation) {
        // Se salió de la sala mientras se conectaba.
        await current.disconnect();
        return;
      }
      connected = true;
      deps.log("[voz] Unido al canal de audio/video");
      sink.connected();
      syncPeers();
      stopTicker = deps.every(1000 / AV.volumeUpdateHz, tick);
      tick();
    },

    async stop() {
      generation++;
      const current = room;
      room = null;
      teardown();
      sink.reset();
      // Desconectar detiene las pistas locales: el navegador libera micrófono y cámara (AC-16).
      if (current) await current.disconnect().catch((cause) => deps.error("[voz] Error al salir del canal", cause));
    },

    async toggleMic() {
      if (!room || !connected) return;
      const next = !mic;
      room.startAudio().catch(() => {});
      try {
        await room.setMicrophoneEnabled(next);
        mic = next;
        sink.setMic(next);
      } catch (cause) {
        deps.error("[voz] No se pudo cambiar el micrófono", cause);
        mic = false;
        sink.deviceFailed("mic", deviceMessage("mic", cause), deps.now());
      }
    },

    async toggleCam() {
      if (!room || !connected) return;
      const next = !cam;
      room.startAudio().catch(() => {});
      try {
        await room.setCameraEnabled(next);
        cam = next;
        sink.setCam(next);
      } catch (cause) {
        deps.error("[voz] No se pudo cambiar la cámara", cause);
        cam = false;
        sink.deviceFailed("cam", deviceMessage("cam", cause), deps.now());
      }
    },

    resumeAudio() {
      room?.startAudio().catch(() => {});
    },

    attachVideo(identity, el) {
      return room ? room.attachVideo(identity, el) : () => {};
    },
  };
}
