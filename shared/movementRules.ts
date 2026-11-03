/**
 * Validación de movimientos recibidos (spec 003). El servidor la aplica a cada posición que envía un
 * participante, con las mismas medidas y obstáculos que usa el cliente (`world.ts`).
 */
import type { MoveMessage } from "./types";
import { AVATAR, MOVE_SPEED, OBSTACLES, ROOM_SIZE, collides, type Vec2 } from "./world";

/** Margen sobre la velocidad máxima por variaciones de red: `factor` multiplica y `slack` (m) suma. */
export const MOVE_TOLERANCE = { factor: 1.5, slack: 0.3 } as const;
/** Tiempo máximo (ms) que se concede entre dos envíos aceptados: tras estar quieto no se gana «crédito». */
export const MAX_MOVE_GAP_MS = 500;
/**
 * Holgura (m) del trazado entre dos envíos: el avatar real rodea las esquinas de las cajas, pero la recta
 * entre dos posiciones puede rozarlas. Se comprueba con un radio menor para no rechazar ese atajo.
 */
const PATH_TOLERANCE = 0.15;
/** Separación (m) entre las muestras del trazado: mucho menor que la caja más estrecha. */
const PATH_SAMPLE_STEP = 0.05;
const BOUNDS_EPSILON = 1e-3;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Mensaje de movimiento si es un objeto con `x`, `z` y `rotY` numéricos y finitos; si no, `null`. */
export function parseMoveMessage(raw: unknown): MoveMessage | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const { x, z, rotY } = raw as Record<string, unknown>;
  if (!isFiniteNumber(x) || !isFiniteNumber(z) || !isFiniteNumber(rotY)) return null;
  return { x, z, rotY };
}

function insideRoom(p: Vec2): boolean {
  const maxX = ROOM_SIZE.width / 2 - AVATAR.radius + BOUNDS_EPSILON;
  const maxZ = ROOM_SIZE.depth / 2 - AVATAR.radius + BOUNDS_EPSILON;
  return Math.abs(p.x) <= maxX && Math.abs(p.z) <= maxZ;
}

/**
 * ¿Es aceptable pasar de `prev` (última posición aceptada) a `next` tras `elapsedMs`?
 * Rechaza destinos fuera de la sala, trazados que cruzan paredes o muebles y saltos más rápidos de lo posible.
 */
export function validateMove(prev: Vec2, next: Vec2, elapsedMs: number): boolean {
  if (!insideRoom(next)) return false;

  const dx = next.x - prev.x;
  const dz = next.z - prev.z;
  const distance = Math.hypot(dx, dz);

  const seconds = Math.min(Math.max(elapsedMs, 0), MAX_MOVE_GAP_MS) / 1000;
  const allowed = MOVE_SPEED * seconds * MOVE_TOLERANCE.factor + MOVE_TOLERANCE.slack;
  if (distance > allowed) return false;

  const radius = AVATAR.radius - PATH_TOLERANCE;
  const samples = Math.max(1, Math.ceil(distance / PATH_SAMPLE_STEP));
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    if (collides({ x: prev.x + dx * t, z: prev.z + dz * t }, radius, OBSTACLES)) return false;
  }
  return true;
}
