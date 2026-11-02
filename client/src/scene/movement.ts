import { ACCELERATION, DECELERATION, TURN_SPEED, type Vec2 } from "@office/shared";

/**
 * Acerca la velocidad actual a la deseada con una rampa corta.
 * Frena y acelera por igual en los dos ejes para que la diagonal no se desvíe.
 */
export function stepVelocity(velocity: Vec2, desired: Vec2, dt: number): Vec2 {
  const stopping = desired.x === 0 && desired.z === 0;
  const maxChange = (stopping ? DECELERATION : ACCELERATION) * dt;

  const dx = desired.x - velocity.x;
  const dz = desired.z - velocity.z;
  const distance = Math.hypot(dx, dz);

  if (distance <= maxChange) return { x: desired.x, z: desired.z };

  const ratio = maxChange / distance;
  return { x: velocity.x + dx * ratio, z: velocity.z + dz * ratio };
}

/** Ángulo (rad) al que mira el avatar para avanzar en esa dirección. Delante es -Z. */
export function angleFromDirection(direction: Vec2): number {
  return Math.atan2(-direction.x, -direction.z);
}

/** Diferencia de ángulos por el camino corto, en (-π, π] (media vuelta exacta gira a la derecha). */
export function shortestAngleDelta(from: number, to: number): number {
  const delta = to - from;
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

/** Gira hacia `target` a velocidad angular constante, sin pasarse. */
export function turnToward(current: number, target: number, dt: number): number {
  const delta = shortestAngleDelta(current, target);
  const maxTurn = TURN_SPEED * dt;

  if (Math.abs(delta) <= maxTurn) return target;
  return current + Math.sign(delta) * maxTurn;
}
