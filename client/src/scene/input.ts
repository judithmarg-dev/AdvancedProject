import type { Vec2 } from "@office/shared";

/** Qué parte de la entrada nos interesa de un evento de teclado o de foco. */
type KeyEvent = { key?: unknown; target?: unknown };

type KeyHandler = (event: KeyEvent) => void;

type ListenerTarget = {
  addEventListener(type: string, handler: KeyHandler): void;
  removeEventListener(type: string, handler: KeyHandler): void;
};

/** W/A/S/D y flechas, equivalentes entre sí. Delante es -Z (convención de three). */
const KEY_DIRECTIONS: Record<string, Vec2> = {
  w: { x: 0, z: -1 },
  arrowup: { x: 0, z: -1 },
  s: { x: 0, z: 1 },
  arrowdown: { x: 0, z: 1 },
  a: { x: -1, z: 0 },
  arrowleft: { x: -1, z: 0 },
  d: { x: 1, z: 0 },
  arrowright: { x: 1, z: 0 },
};

/** ¿El evento viene de un campo donde se escribe (chat)? Ahí las teclas son texto, no movimiento (spec 004 AC-9). */
export function isEditableTarget(target: unknown): boolean {
  if (typeof target !== "object" || target === null) return false;
  const { tagName, isContentEditable } = target as { tagName?: unknown; isContentEditable?: unknown };
  return tagName === "INPUT" || tagName === "TEXTAREA" || isContentEditable === true;
}

export function isMovementKey(key: string): boolean {
  return key.toLowerCase() in KEY_DIRECTIONS;
}

/** Suma las teclas pulsadas y normaliza: la diagonal avanza a la misma velocidad que la recta. */
export function directionFromKeys(keys: Iterable<string>): Vec2 {
  let x = 0;
  let z = 0;

  for (const key of keys) {
    const direction = KEY_DIRECTIONS[key.toLowerCase()];
    if (!direction) continue;
    x += direction.x;
    z += direction.z;
  }

  const length = Math.hypot(x, z);
  if (length === 0) return { x: 0, z: 0 };
  return { x: x / length, z: z / length };
}

/**
 * Escucha el teclado y mantiene el conjunto de teclas pulsadas.
 * Al perder el foco o esconderse la pestaña se olvida todo: si no, el avatar seguiría
 * moviéndose con una tecla cuyo `keyup` nunca llega (AC-15).
 */
export function createKeyboardInput(target: ListenerTarget) {
  const pressed = new Set<string>();

  const onKeyDown = (event: KeyEvent) => {
    if (typeof event.key !== "string" || isEditableTarget(event.target)) return;
    if (isMovementKey(event.key)) pressed.add(event.key.toLowerCase());
  };

  const onKeyUp = (event: KeyEvent) => {
    if (typeof event.key !== "string") return;
    pressed.delete(event.key.toLowerCase());
  };

  const clear = () => pressed.clear();
  // Al pasar a escribir, las teclas que seguían pulsadas no deben dejar al avatar andando (spec 004 AC-9).
  const onFocusIn = (event: KeyEvent) => {
    if (isEditableTarget(event.target)) clear();
  };

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("blur", clear);
  target.addEventListener("visibilitychange", clear);
  target.addEventListener("focusin", onFocusIn);

  return {
    direction: (): Vec2 => directionFromKeys(pressed),
    isMoving: () => pressed.size > 0,
    dispose() {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", clear);
      target.removeEventListener("visibilitychange", clear);
      target.removeEventListener("focusin", onFocusIn);
      pressed.clear();
    },
  };
}
