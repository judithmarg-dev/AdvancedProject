import { SEND_RATE_HZ } from "@office/shared";
import type { PlayerPose } from "./interpolation";

/** Cambios menores no cuentan como movimiento (m y rad). */
const POSITION_EPSILON = 1e-3;
const ANGLE_EPSILON = 1e-3;

function changed(a: PlayerPose, b: PlayerPose): boolean {
  return (
    Math.abs(a.x - b.x) > POSITION_EPSILON ||
    Math.abs(a.z - b.z) > POSITION_EPSILON ||
    Math.abs(a.rotY - b.rotY) > ANGLE_EPSILON
  );
}

/**
 * Decide en cada fotograma si toca enviar la pose propia: como mucho a `rateHz` y solo si cambió desde el
 * último envío. Al pararse, la pose final difiere de la última enviada y sale en el siguiente turno;
 * después ya no hay cambios y deja de enviar (spec 003 AC-10).
 */
export function createSendPolicy(initial: PlayerPose, rateHz = SEND_RATE_HZ) {
  const interval = 1000 / rateHz;
  let lastSent = { ...initial };
  let lastSentAt = Number.NEGATIVE_INFINITY;

  return {
    /** Devuelve la pose a enviar ahora, o `null`. */
    update(now: number, pose: PlayerPose): PlayerPose | null {
      if (now - lastSentAt < interval || !changed(pose, lastSent)) return null;
      lastSent = { ...pose };
      lastSentAt = now;
      return lastSent;
    },
    /** Tras una corrección del servidor, esa es la última pose conocida por él. */
    reset(pose: PlayerPose) {
      lastSent = { ...pose };
    },
  };
}
