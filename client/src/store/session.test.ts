import { beforeEach, describe, expect, it } from "vitest";
import { CONNECTION_LOST_MESSAGE, createSessionStore } from "./session";

describe("sesión del participante", () => {
  let store: ReturnType<typeof createSessionStore>;
  beforeEach(() => {
    store = createSessionStore();
  });

  it("empieza en la pantalla de entrada, sin conexión ni participantes (AC-1)", () => {
    expect(store.getState()).toMatchObject({ phase: "entry", error: null, selfId: null, self: null, remotes: {} });
  });

  it("al pedir entrar pasa a conectando y borra el aviso anterior", () => {
    store.getState().joinFailed("No se pudo conectar");
    store.getState().startJoin("Ana");
    expect(store.getState()).toMatchObject({ phase: "connecting", name: "Ana", error: null });
  });

  it("al entrar pasa a la sala con su identificador, nombre y color asignado (AC-4)", () => {
    store.getState().startJoin("Ana");
    store.getState().joined("s1", { name: "Ana", color: "#F4B6A6" });
    expect(store.getState()).toMatchObject({ phase: "inRoom", selfId: "s1", self: { name: "Ana", color: "#F4B6A6" } });
  });

  it("si no puede entrar vuelve a la pantalla de entrada con aviso y conserva el nombre (AC-17, AC-19)", () => {
    store.getState().startJoin("Ana");
    store.getState().joinFailed("La sala está completa");
    expect(store.getState()).toMatchObject({ phase: "entry", name: "Ana", error: "La sala está completa" });
  });

  it("al perder la conexión vuelve a la entrada, conserva el nombre y vacía la sala (AC-18)", () => {
    store.getState().startJoin("Ana");
    store.getState().joined("s1", { name: "Ana", color: "#F4B6A6" });
    store.getState().playerAdded("s2", { name: "Bea", color: "#A9CBE8" });

    store.getState().connectionLost();

    expect(store.getState()).toMatchObject({
      phase: "entry",
      name: "Ana",
      selfId: null,
      self: null,
      remotes: {},
      error: CONNECTION_LOST_MESSAGE,
    });
  });

  it("registra altas y bajas de los demás participantes (AC-5, AC-15)", () => {
    store.getState().playerAdded("s2", { name: "Bea", color: "#A9CBE8" });
    store.getState().playerAdded("s3", { name: "Cris", color: "#F3D98B" });
    store.getState().playerRemoved("s2");
    expect(store.getState().remotes).toEqual({ s3: { name: "Cris", color: "#F3D98B" } });
  });

  it("dar de alta dos veces al mismo participante no lo duplica (AC-16)", () => {
    store.getState().playerAdded("s2", { name: "Bea", color: "#A9CBE8" });
    store.getState().playerAdded("s2", { name: "Bea", color: "#A9CBE8" });
    expect(Object.keys(store.getState().remotes)).toEqual(["s2"]);
  });
});
