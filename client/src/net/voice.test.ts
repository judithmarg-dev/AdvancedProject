import { describe, expect, it, vi } from "vitest";
import type { Vec2 } from "@office/shared";
import { AV_MESSAGES } from "../store/av";
import { createVoice, type VoiceDeps, type VoiceRoom, type VoiceRoomEvents, type VoiceSink } from "./voice";

type FakePeer = { identity: string; micOn: boolean; camOn: boolean; volume: number | null };

function fakeRoom() {
  const peers: FakePeer[] = [];
  let events: VoiceRoomEvents | null = null;
  const room = {
    peers,
    connect: vi.fn(async (_url: string, _token: string) => {}),
    disconnect: vi.fn(async () => {}),
    setMicrophoneEnabled: vi.fn(async (_on: boolean) => {}),
    setCameraEnabled: vi.fn(async (_on: boolean) => {}),
    startAudio: vi.fn(async () => {}),
    attachVideo: vi.fn(() => () => {}),
    participants: () =>
      peers.map((p) => ({
        identity: p.identity,
        micOn: p.micOn,
        camOn: p.camOn,
        setVolume: (v: number) => (p.volume = v),
      })),
    listen: (e: VoiceRoomEvents) => {
      events = e;
    },
    emit: () => events!,
  };
  return room satisfies VoiceRoom & Record<string, unknown>;
}

function setup(poses: Record<string, Vec2> = {}, self: Vec2 | null = { x: 0, z: 0 }) {
  const room = fakeRoom();
  let ticker: (() => void) | null = null;
  const deps: VoiceDeps = {
    createRoom: () => room,
    selfPose: () => self,
    peerPose: (id) => poses[id] ?? null,
    now: () => 1000,
    every: (_ms, fn) => {
      ticker = fn;
      return () => (ticker = null);
    },
    log: () => {},
    error: () => {},
  };
  const sink: VoiceSink = {
    reset: vi.fn(),
    connecting: vi.fn(),
    connected: vi.fn(),
    unavailable: vi.fn(),
    setMic: vi.fn(),
    setCam: vi.fn(),
    deviceFailed: vi.fn(),
    peers: vi.fn(),
    speakers: vi.fn(),
    visibleVideos: vi.fn(),
  };
  const voice = createVoice(deps, sink);
  return { room, sink, voice, tick: () => ticker?.(), hasTicker: () => ticker !== null };
}

const grant = { ok: true as const, url: "ws://lk", token: "tok" };

describe("canal de audio/video (spec 005)", () => {
  it("con acceso concedido se une sin pasos extra (AC-1)", async () => {
    const { room, sink, voice } = setup();
    await voice.start(grant);
    expect(room.connect).toHaveBeenCalledWith("ws://lk", "tok");
    expect(sink.connecting).toHaveBeenCalled();
    expect(sink.connected).toHaveBeenCalled();
    expect(room.setMicrophoneEnabled).not.toHaveBeenCalled();
    expect(room.setCameraEnabled).not.toHaveBeenCalled();
  });

  it("sin servicio o si la conexión falla queda no disponible, sin romper nada (AC-3)", async () => {
    const disabled = setup();
    await disabled.voice.start({ ok: false, reason: "disabled" });
    expect(disabled.sink.unavailable).toHaveBeenCalledWith(AV_MESSAGES.unavailable, 1000);
    expect(disabled.room.connect).not.toHaveBeenCalled();

    const failing = setup();
    failing.room.connect.mockRejectedValueOnce(new Error("no hay servidor"));
    await failing.voice.start(grant);
    expect(failing.sink.unavailable).toHaveBeenCalledWith(AV_MESSAGES.unavailable, 1000);
    expect(failing.hasTicker()).toBe(false);
  });

  it("conmuta el micrófono (AC-5) y la cámara (AC-7)", async () => {
    const { room, sink, voice } = setup();
    await voice.start(grant);
    await voice.toggleMic();
    expect(room.setMicrophoneEnabled).toHaveBeenLastCalledWith(true);
    expect(sink.setMic).toHaveBeenLastCalledWith(true);
    await voice.toggleMic();
    expect(room.setMicrophoneEnabled).toHaveBeenLastCalledWith(false);
    expect(sink.setMic).toHaveBeenLastCalledWith(false);

    await voice.toggleCam();
    expect(room.setCameraEnabled).toHaveBeenLastCalledWith(true);
    expect(sink.setCam).toHaveBeenLastCalledWith(true);
    expect(room.startAudio).toHaveBeenCalled();
  });

  it("si se deniega el permiso avisa con el motivo y el dispositivo queda apagado (AC-6)", async () => {
    const { room, sink, voice } = setup();
    await voice.start(grant);
    room.setMicrophoneEnabled.mockRejectedValueOnce(Object.assign(new Error("x"), { name: "NotAllowedError" }));
    await voice.toggleMic();
    expect(sink.deviceFailed).toHaveBeenCalledWith("mic", AV_MESSAGES.micDenied, 1000);
    expect(sink.setMic).not.toHaveBeenCalledWith(true);

    room.setCameraEnabled.mockRejectedValueOnce(Object.assign(new Error("x"), { name: "NotFoundError" }));
    await voice.toggleCam();
    expect(sink.deviceFailed).toHaveBeenCalledWith("cam", AV_MESSAGES.camMissing, 1000);

    // Tras el fallo, un nuevo intento vuelve a pedir encender.
    await voice.toggleMic();
    expect(room.setMicrophoneEnabled).toHaveBeenLastCalledWith(true);
  });

  it("sin conexión los botones no hacen nada", async () => {
    const { room, voice } = setup();
    await voice.toggleMic();
    await voice.toggleCam();
    expect(room.setMicrophoneEnabled).not.toHaveBeenCalled();
    expect(room.setCameraEnabled).not.toHaveBeenCalled();
  });

  it("ajusta el volumen de cada uno según su propia distancia (AC-9..AC-12)", async () => {
    const { room, voice, tick } = setup({ cerca: { x: 1, z: 0 }, medio: { x: 5, z: 0 }, lejos: { x: 0, z: 9 } });
    room.peers.push(
      { identity: "cerca", micOn: true, camOn: false, volume: null },
      { identity: "medio", micOn: true, camOn: false, volume: null },
      { identity: "lejos", micOn: true, camOn: false, volume: null },
      { identity: "sinPose", micOn: true, camOn: false, volume: null },
    );
    await voice.start(grant);
    tick();
    const [cerca, medio, lejos, sinPose] = room.peers as [FakePeer, FakePeer, FakePeer, FakePeer];
    expect(cerca.volume).toBe(1);
    expect(medio.volume).toBeGreaterThan(0);
    expect(medio.volume).toBeLessThan(1);
    expect(lejos.volume).toBe(0);
    expect(sinPose.volume).toBe(0);
  });

  it("recalcula el volumen al moverse, sin reconectar (AC-11)", async () => {
    const poses: Record<string, Vec2> = { b: { x: 9, z: 0 } };
    const { room, voice, tick } = setup(poses);
    room.peers.push({ identity: "b", micOn: true, camOn: false, volume: null });
    await voice.start(grant);
    tick();
    expect(room.peers[0]!.volume).toBe(0);
    poses.b = { x: 1, z: 0 };
    tick();
    expect(room.peers[0]!.volume).toBe(1);
    expect(room.connect).toHaveBeenCalledTimes(1);
  });

  it("muestra el video de los cercanos con cámara (AC-14)", async () => {
    const { room, sink, voice, tick } = setup({ a: { x: 1, z: 0 }, b: { x: 3, z: 0 }, c: { x: 10, z: 0 } });
    room.peers.push(
      { identity: "a", micOn: false, camOn: true, volume: null },
      { identity: "b", micOn: false, camOn: false, volume: null },
      { identity: "c", micOn: false, camOn: true, volume: null },
    );
    await voice.start(grant);
    tick();
    expect(sink.visibleVideos).toHaveBeenLastCalledWith(["a"]);
  });

  it("refleja altas, bajas y cambios de los participantes, y quién habla (AC-13, AC-15)", async () => {
    const { room, sink, voice } = setup();
    await voice.start(grant);
    room.peers.push({ identity: "b", micOn: true, camOn: false, volume: null });
    room.emit().changed();
    expect(sink.peers).toHaveBeenLastCalledWith({ b: { micOn: true, camOn: false } });
    room.emit().speakers(["b"]);
    expect(sink.speakers).toHaveBeenLastCalledWith(["b"]);
    room.peers.pop();
    room.emit().changed();
    expect(sink.peers).toHaveBeenLastCalledWith({});
  });

  it("si se pierde solo la voz, avisa y sigue en la sala (AC-17)", async () => {
    const { sink, voice, room, hasTicker } = setup();
    await voice.start(grant);
    room.emit().disconnected();
    expect(sink.unavailable).toHaveBeenCalledWith(AV_MESSAGES.lost, 1000);
    expect(hasTicker()).toBe(false);
  });

  it("al salir desconecta, libera los dispositivos y no avisa de pérdida (AC-16)", async () => {
    const { sink, voice, room, hasTicker } = setup();
    await voice.start(grant);
    await voice.toggleMic();
    await voice.stop();
    room.emit().disconnected();
    expect(room.disconnect).toHaveBeenCalled();
    expect(sink.reset).toHaveBeenCalled();
    expect(sink.unavailable).not.toHaveBeenCalledWith(AV_MESSAGES.lost, expect.anything());
    expect(hasTicker()).toBe(false);
  });

  it("si se sale mientras se conecta, no queda unido", async () => {
    const { room, voice, sink } = setup();
    let finish: () => void = () => {};
    room.connect.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)));
    const starting = voice.start(grant);
    await voice.stop();
    finish();
    await starting;
    expect(room.disconnect).toHaveBeenCalled();
    expect(sink.connected).not.toHaveBeenCalled();
  });
});
