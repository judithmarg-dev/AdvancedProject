import { describe, expect, it } from "vitest";
import { createKeyboardInput, directionFromKeys } from "./input";

/** Objetivo de eventos falso: permite disparar teclas sin navegador. */
function fakeTarget() {
  const handlers = new Map<string, Set<(event: { key?: unknown }) => void>>();
  return {
    addEventListener(type: string, handler: (event: { key?: unknown }) => void) {
      const set = handlers.get(type) ?? new Set();
      set.add(handler);
      handlers.set(type, set);
    },
    removeEventListener(type: string, handler: (event: { key?: unknown }) => void) {
      handlers.get(type)?.delete(handler);
    },
    emit(type: string, event: { key?: unknown } = {}) {
      for (const handler of [...(handlers.get(type) ?? [])]) handler(event);
    },
    count(type: string) {
      return handlers.get(type)?.size ?? 0;
    },
  };
}

describe("directionFromKeys (AC-3, AC-5)", () => {
  it("avanza hacia delante con W y con la flecha arriba", () => {
    expect(directionFromKeys(["w"])).toEqual({ x: 0, z: -1 });
    expect(directionFromKeys(["ArrowUp"])).toEqual({ x: 0, z: -1 });
  });

  it("cubre las cuatro direcciones", () => {
    expect(directionFromKeys(["s"])).toEqual({ x: 0, z: 1 });
    expect(directionFromKeys(["a"])).toEqual({ x: -1, z: 0 });
    expect(directionFromKeys(["d"])).toEqual({ x: 1, z: 0 });
  });

  it("ignora las teclas ajenas al movimiento", () => {
    expect(directionFromKeys(["Shift", "q"])).toEqual({ x: 0, z: 0 });
  });

  it("normaliza la diagonal: misma velocidad que en línea recta (AC-5)", () => {
    const diagonal = directionFromKeys(["w", "d"]);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(1, 6);
    expect(diagonal.x).toBeCloseTo(Math.SQRT1_2, 6);
    expect(diagonal.z).toBeCloseTo(-Math.SQRT1_2, 6);
  });

  it("anula las direcciones opuestas", () => {
    expect(directionFromKeys(["w", "s", "a", "d"])).toEqual({ x: 0, z: 0 });
  });
});

describe("createKeyboardInput (AC-3, AC-15)", () => {
  it("mantiene la dirección mientras la tecla sigue pulsada y la suelta en keyup", () => {
    const target = fakeTarget();
    const input = createKeyboardInput(target);

    target.emit("keydown", { key: "w" });
    expect(input.direction()).toEqual({ x: 0, z: -1 });

    target.emit("keyup", { key: "w" });
    expect(input.direction()).toEqual({ x: 0, z: 0 });
  });

  it("acepta mayúsculas (bloqueo de mayúsculas activo)", () => {
    const target = fakeTarget();
    const input = createKeyboardInput(target);

    target.emit("keydown", { key: "D" });
    expect(input.direction()).toEqual({ x: 1, z: 0 });
  });

  it("olvida las teclas al perder el foco (AC-15)", () => {
    const target = fakeTarget();
    const input = createKeyboardInput(target);

    target.emit("keydown", { key: "w" });
    target.emit("blur");
    expect(input.direction()).toEqual({ x: 0, z: 0 });
  });

  it("olvida las teclas al ocultarse la pestaña (AC-15)", () => {
    const target = fakeTarget();
    const input = createKeyboardInput(target);

    target.emit("keydown", { key: "a" });
    target.emit("visibilitychange");
    expect(input.direction()).toEqual({ x: 0, z: 0 });
  });

  it("deja de escuchar al liberarse", () => {
    const target = fakeTarget();
    const input = createKeyboardInput(target);
    input.dispose();

    expect(target.count("keydown")).toBe(0);
    expect(target.count("keyup")).toBe(0);
    target.emit("keydown", { key: "w" });
    expect(input.direction()).toEqual({ x: 0, z: 0 });
  });
});
