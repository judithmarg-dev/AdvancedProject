import { createStore, useStore } from "zustand";

/** Canal de audio/video: sin unir, uniéndose, unido o no disponible (spec 005 AC-3, AC-17). */
export type AvStatus = "off" | "connecting" | "connected" | "unavailable";

/** Lo que se sabe de cada participante remoto en el canal, por su id de sesión. */
export type PeerAv = { micOn: boolean; camOn: boolean };

export type AvNotice = { text: string; at: number };

export const AV_MESSAGES = {
  unavailable: "La voz no está disponible ahora",
  lost: "Se perdió la conexión de voz",
  micDenied: "Permiso de micrófono denegado",
  camDenied: "Permiso de cámara denegado",
  micMissing: "No se encontró ningún micrófono",
  camMissing: "No se encontró ninguna cámara",
  micFailed: "No se pudo activar el micrófono",
  camFailed: "No se pudo activar la cámara",
} as const;

/** Tiempo (ms) que se muestra un aviso. */
export const AV_NOTICE_MS = 4000;

export interface AvState {
  status: AvStatus;
  mic: boolean;
  cam: boolean;
  notice: AvNotice | null;
  /** Ids de sesión que hablan ahora (puede incluir el propio). */
  speaking: string[];
  peerState: Record<string, PeerAv>;
  /** Ids de sesión cuyo video se muestra, del más cercano al más lejano. */
  videos: string[];
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

const initial = {
  status: "off" as AvStatus,
  mic: false,
  cam: false,
  notice: null,
  speaking: [],
  peerState: {},
  videos: [],
};

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function createAvStore() {
  return createStore<AvState>()((set) => ({
    ...initial,
    reset: () => set({ ...initial }),
    connecting: () => set({ status: "connecting", notice: null }),
    connected: () => set({ status: "connected" }),
    unavailable: (text, now) =>
      set({ status: "unavailable", mic: false, cam: false, notice: { text, at: now }, speaking: [], peerState: {}, videos: [] }),
    setMic: (mic) => set({ mic }),
    setCam: (cam) => set({ cam }),
    deviceFailed: (kind, text, now) => set(kind === "mic" ? { mic: false, notice: { text, at: now } } : { cam: false, notice: { text, at: now } }),
    peers: (peerState) =>
      set((state) => ({
        peerState,
        videos: state.videos.filter((id) => id in peerState),
        speaking: state.speaking.filter((id) => id in peerState || !(id in state.peerState)),
      })),
    speakers: (ids) => set((state) => (sameList(state.speaking, ids) ? {} : { speaking: ids })),
    visibleVideos: (ids) => set((state) => (sameList(state.videos, ids) ? {} : { videos: ids })),
  }));
}

/** Estado de audio/video de la página. */
export const avStore = createAvStore();

export function useAv<T>(selector: (state: AvState) => T): T {
  return useStore(avStore, selector);
}

/** Icono junto al nombre: hablando, micrófono apagado o nada (spec 005 AC-13). */
export type VoiceMark = "none" | "speaking" | "muted";

export function voiceMark(state: Pick<AvState, "status" | "mic" | "speaking" | "peerState">, selfId: string | null, id: string): VoiceMark {
  if (state.status !== "connected") return "none";
  const micOn = id === selfId ? state.mic : state.peerState[id]?.micOn;
  if (micOn === undefined) return "none";
  if (!micOn) return "muted";
  return state.speaking.includes(id) ? "speaking" : "none";
}
