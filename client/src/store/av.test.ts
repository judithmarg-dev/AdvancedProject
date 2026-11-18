import { describe, expect, it } from "vitest";
import { AV_MESSAGES, createAvStore, voiceMark } from "./av";

describe("estado de audio/video (spec 005)", () => {
  it("empieza apagado, con micrófono y cámara apagados (AC-4)", () => {
    const store = createAvStore();
    expect(store.getState()).toMatchObject({ status: "off", mic: false, cam: false, notice: null, speaking: [] });
  });

  it("conectado: micrófono y cámara siguen apagados hasta que se encienden (AC-4)", () => {
    const store = createAvStore();
    store.getState().connecting();
    store.getState().connected();
    expect(store.getState()).toMatchObject({ status: "connected", mic: false, cam: false });
    store.getState().setMic(true);
    store.getState().setCam(true);
    expect(store.getState()).toMatchObject({ mic: true, cam: true });
  });

  it("sin servicio queda no disponible, con aviso y dispositivos apagados (AC-3, AC-17)", () => {
    const store = createAvStore();
    store.getState().connected();
    store.getState().setMic(true);
    store.getState().unavailable(AV_MESSAGES.lost, 1000);
    expect(store.getState()).toMatchObject({
      status: "unavailable",
      mic: false,
      cam: false,
      notice: { text: AV_MESSAGES.lost, at: 1000 },
    });
  });

  it("un error de dispositivo avisa y deja el dispositivo apagado (AC-6)", () => {
    const store = createAvStore();
    store.getState().connected();
    store.getState().deviceFailed("mic", AV_MESSAGES.micDenied, 500);
    expect(store.getState()).toMatchObject({ status: "connected", mic: false, notice: { text: AV_MESSAGES.micDenied } });
  });

  it("guarda quién habla y el estado de cada participante (AC-13)", () => {
    const store = createAvStore();
    store.getState().peers({ b: { micOn: true, camOn: false } });
    store.getState().speakers(["b", "self"]);
    expect(store.getState().speaking).toEqual(["b", "self"]);
    expect(store.getState().peerState.b).toEqual({ micOn: true, camOn: false });
  });

  it("al irse un participante desaparece su estado y su video (AC-15)", () => {
    const store = createAvStore();
    store.getState().peers({ b: { micOn: true, camOn: true } });
    store.getState().visibleVideos(["b"]);
    store.getState().speakers(["b"]);
    store.getState().peers({});
    expect(store.getState().peerState).toEqual({});
    expect(store.getState().videos).toEqual([]);
    expect(store.getState().speaking).toEqual([]);
  });

  it("reset vuelve al estado inicial (AC-16)", () => {
    const store = createAvStore();
    store.getState().connected();
    store.getState().setMic(true);
    store.getState().peers({ b: { micOn: true, camOn: true } });
    store.getState().reset();
    expect(store.getState()).toMatchObject({ status: "off", mic: false, cam: false, peerState: {}, videos: [], notice: null });
  });

  it("solo cambia la lista de videos si cambia de verdad", () => {
    const store = createAvStore();
    store.getState().visibleVideos(["a", "b"]);
    const before = store.getState().videos;
    store.getState().visibleVideos(["a", "b"]);
    expect(store.getState().videos).toBe(before);
  });
});

describe("indicador de voz sobre el avatar (spec 005 AC-13)", () => {
  const connected = () => {
    const store = createAvStore();
    store.getState().connected();
    return store;
  };

  it("sin canal de voz no muestra nada", () => {
    expect(voiceMark(createAvStore().getState(), "me", "me")).toBe("none");
  });

  it("micrófono apagado: icono de silenciado, propio y ajeno", () => {
    const store = connected();
    store.getState().peers({ b: { micOn: false, camOn: false } });
    expect(voiceMark(store.getState(), "me", "me")).toBe("muted");
    expect(voiceMark(store.getState(), "me", "b")).toBe("muted");
  });

  it("micrófono encendido: icono de habla solo mientras habla", () => {
    const store = connected();
    store.getState().setMic(true);
    store.getState().peers({ b: { micOn: true, camOn: false } });
    expect(voiceMark(store.getState(), "me", "me")).toBe("none");
    store.getState().speakers(["me", "b"]);
    expect(voiceMark(store.getState(), "me", "me")).toBe("speaking");
    expect(voiceMark(store.getState(), "me", "b")).toBe("speaking");
  });

  it("quien no está en el canal de voz no lleva indicador", () => {
    expect(voiceMark(connected().getState(), "me", "c")).toBe("none");
  });
});
