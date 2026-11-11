import { describe, expect, it } from "vitest";
import { createKeyboardInput, directionFromKeys, isEditableTarget } from "./input";

/** Objetivo de eventos falso: permite disparar teclas sin navegador. */
function fakeTarget() {
  const handlers = new Map<string, Set<(event: { key?: unknown; target?: unknown }) => void>>();
  return {
    addEventListener(type: string, handler: (event: { key?: unknown; target?: unknown }) => void) {
      const set = handlers.get(type) ?? new Set();
      set.add(handler);
      handlers.set(type, set);
    },
    removeEventListener(type: string, handler: (event: { key?: unknown; target?: unknown }) => void) {
      handlers.get(type)?.delete(handler);
    },
    emit(type: string, event: { key?: unknown; target?: unknown } = {}) {
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

describe("teclado mientras se escribe en el chat (spec 004 AC-9)", () => {
  const input = { tagName: "INPUT" };
  const textarea = { tagName: "TEXTAREA" };
  const editable = { tagName: "DIV", isContentEditable: true };
  const canvas = { tagName: "CANVAS" };

  it("reconoce los campos de texto", () => {
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
    expect(isEditableTarget(editable)).toBe(true);
    expect(isEditableTarget(canvas)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(undefined)).toBe(false);
  });

  it("las teclas de movimiento pulsadas en un campo de texto no mueven el avatar", () => {
    const target = fakeTarget();
    const keyboard = createKeyboardInput(target);
    target.emit("keydown", { key: "w", target: input });
    target.emit("keydown", { key: "ArrowLeft", target: textarea });
    expect(keyboard.direction()).toEqual({ x: 0, z: 0 });
    expect(keyboard.isMoving()).toBe(false);
  });

  it("fuera del campo las teclas vuelven a mover", () => {
    const target = fakeTarget();
    const keyboard = createKeyboardInput(target);
    target.emit("keydown", { key: "w", target: canvas });
    expect(keyboard.direction()).toEqual({ x: 0, z: -1 });
  });

  it("al entrar en un campo de texto olvida las teclas que estaban pulsadas", () => {
    const target = fakeTarget();
    const keyboard = createKeyboardInput(target);
    target.emit("keydown", { key: "d", target: canvas });
    target.emit("focusin", { target: input });
    expect(keyboard.isMoving()).toBe(false);
  });

  it("enfocar algo que no es un campo de texto no olvida las teclas", () => {
    const target = fakeTarget();
    const keyboard = createKeyboardInput(target);
    target.emit("keydown", { key: "d", target: canvas });
    target.emit("focusin", { target: canvas });
    expect(keyboard.isMoving()).toBe(true);
  });

  it("deja de escuchar focusin al liberarse", () => {
    const target = fakeTarget();
    createKeyboardInput(target).dispose();
    expect(target.count("focusin")).toBe(0);
  });
});
