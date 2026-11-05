import { MOVE_SPEED } from "@office/shared";

/** Segundos por ciclo de respiración en reposo. */
export const BREATHING_PERIOD = 3.2;
const BREATHING_AMPLITUDE = 0.035;

/** Paso de caminata: ciclos por metro recorrido, y altura máxima del balanceo. */
const WALK_FREQUENCY = 2.6;
const WALK_AMPLITUDE = 0.05;

/** Cuánto deforma cada m/s² de cambio de velocidad, y tope de la deformación. */
const SQUASH_STRENGTH = 0.012;
const SQUASH_LIMIT = 0.2;

/** Oscilación vertical suave del avatar quieto (AC-11). */
export function breathingOffset(time: number): number {
  return Math.sin((time / BREATHING_PERIOD) * Math.PI * 2) * BREATHING_AMPLITUDE;
}

/**
 * Avanza la fase del paso según lo andado en `delta` segundos. Acumular la fase (en vez de calcularla como
 * tiempo × velocidad) mantiene el balanceo continuo aunque la velocidad varíe (spec 003 AC-9).
 */
export function advanceWalkPhase(phase: number, delta: number, speed: number): number {
  if (speed <= 0) return phase;
  return phase + delta * WALK_FREQUENCY * Math.PI * Math.min(speed / MOVE_SPEED, 1);
}

/** Balanceo al caminar en una fase dada: crece con la velocidad y desaparece al pararse (AC-12). */
export function walkBob(phase: number, speed: number): number {
  if (speed <= 0) return 0;
  const intensity = Math.min(speed / MOVE_SPEED, 1);
  return Math.abs(Math.sin(phase)) * WALK_AMPLITUDE * intensity;
}

/**
 * Deformación elástica según el cambio de velocidad (m/s²): se estira al arrancar,
 * se aplasta al frenar y vuelve a la forma de reposo cuando la velocidad deja de cambiar.
 * El volumen aparente se conserva (AC-12).
 */
export function squashScale(acceleration: number): { x: number; y: number; z: number } {
  const amount = Math.max(-SQUASH_LIMIT, Math.min(SQUASH_LIMIT, acceleration * SQUASH_STRENGTH));
  const y = 1 + amount;
  const sides = 1 / Math.sqrt(y);
  return { x: sides, y, z: sides };
}
