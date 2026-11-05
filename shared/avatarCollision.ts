/**
 * Colisiones entre avatares (spec 003, AC-22–AC-25). Cada avatar es un círculo de radio `AVATAR.radius`;
 * dos avatares están en contacto cuando sus centros distan `AVATAR_GAP`.
 * El cliente frena con `moveAvatar`; el servidor elige el hueco de entrada y rechaza solapes claros.
 */
import { AVATAR, OBSTACLES, ROOM_SIZE, SPAWN, collides, resolveMovement, type Box2, type Vec2 } from "./world";

/** Distancia mínima entre los centros de dos avatares. */
export const AVATAR_GAP = AVATAR.radius * 2;
/**
 * Margen del servidor: cada cliente ve a los demás con ~100–150 ms de retraso, así que dos avatares que se
 * cruzan pueden solaparse un poco. Solo se rechaza si los centros quedan a menos de esta distancia.
 */
export const AVATAR_OVERLAP_TOLERANCE = AVATAR.radius;
/** Separación de la rejilla con la que se buscan huecos de entrada (m). */
const SPAWN_GRID_STEP = 0.25;
const EPSILON = 1e-9;

const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);

/** Distancia mínima permitida a `other`: el contacto o, si ya se solapaban, no acercarse más. */
const limitFor = (from: Vec2, other: Vec2) => Math.min(AVATAR_GAP, dist(from, other));

function penetrates(from: Vec2, to: Vec2, other: Vec2): boolean {
  return dist(to, other) < limitFor(from, other) - EPSILON;
}

/** Proyecta `to` sobre el borde de `other` si se mete dentro: así se detiene al contacto o se desliza. */
function pushOut(from: Vec2, to: Vec2, other: Vec2): Vec2 {
  const limit = limitFor(from, other);
  const d = dist(to, other);
  if (d >= limit) return to;
  if (d < EPSILON) return from;
  const k = limit / d;
  return { x: other.x + (to.x - other.x) * k, z: other.z + (to.z - other.z) * k };
}

/** Destino de pasar de `from` a `to` sin meterse en ningún avatar de `others`. Si no hay forma, se queda. */
export function separateFromAvatars(from: Vec2, to: Vec2, others: readonly Vec2[]): Vec2 {
  let result = to;
  // Un paso largo podría saltar por encima de otro avatar: se limita al punto del trazado más cercano a él.
  for (const other of others) result = pushOut(from, clampThrough(from, result, other), other);
  return others.some((other) => penetrates(from, result, other)) ? from : result;
}

/** Si el trazado `from → to` atraviesa a `other`, recorta `to` al punto del trazado más cercano a él. */
function clampThrough(from: Vec2, to: Vec2, other: Vec2): Vec2 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len2 = dx * dx + dz * dz;
  if (len2 < EPSILON) return to;
  const t = ((other.x - from.x) * dx + (other.z - from.z) * dz) / len2;
  if (t <= 0 || t >= 1) return to;
  const closest = { x: from.x + dx * t, z: from.z + dz * t };
  return dist(closest, other) < limitFor(from, other) ? closest : to;
}

/** Movimiento del avatar propio: paredes y muebles (`resolveMovement`) y además los demás avatares. */
export function moveAvatar(
  from: Vec2,
  delta: Vec2,
  others: readonly Vec2[],
  radius: number = AVATAR.radius,
  boxes: readonly Box2[] = OBSTACLES,
): Vec2 {
  const walled = resolveMovement(from, delta, radius, boxes);
  const separated = separateFromAvatars(from, walled, others);
  // Rodear a otro avatar puede empujar contra un mueble: se vuelve a recortar contra las cajas.
  const final = resolveMovement(from, { x: separated.x - from.x, z: separated.z - from.z }, radius, boxes);
  return others.some((other) => penetrates(from, final, other)) ? from : final;
}

/** Punto de entrada: `SPAWN` si está libre; si no, el hueco libre de la rejilla más cercano a él. */
export function findSpawn(occupied: readonly Vec2[]): Vec2 {
  const free = (p: Vec2) => !collides(p, AVATAR.radius, OBSTACLES) && occupied.every((o) => dist(p, o) >= AVATAR_GAP);
  if (free(SPAWN)) return { ...SPAWN };

  const maxX = ROOM_SIZE.width / 2 - AVATAR.radius;
  const maxZ = ROOM_SIZE.depth / 2 - AVATAR.radius;
  const steps = Math.ceil(Math.max(ROOM_SIZE.width, ROOM_SIZE.depth) / SPAWN_GRID_STEP);
  let best: Vec2 | null = null;
  let bestDist = Infinity;
  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const p = { x: SPAWN.x + i * SPAWN_GRID_STEP, z: SPAWN.z + j * SPAWN_GRID_STEP };
      if (Math.abs(p.x) > maxX || Math.abs(p.z) > maxZ) continue;
      const d = dist(p, SPAWN);
      if (d < bestDist && free(p)) {
        best = p;
        bestDist = d;
      }
    }
  }
  return best ?? { ...SPAWN };
}

/**
 * ¿El paso `from → to` se mete claramente en otro avatar (AC-25)? Mide la distancia mínima del trazado,
 * para detectar también atravesarlo; alejarse de un solape previo nunca cuenta (AC-23).
 */
export function overlapsAvatar(from: Vec2, to: Vec2, others: readonly Vec2[]): boolean {
  return others.some((other) => {
    const nearest = segmentDistance(from, to, other);
    return nearest < AVATAR_OVERLAP_TOLERANCE && nearest < dist(from, other) - EPSILON;
  });
}

function segmentDistance(a: Vec2, b: Vec2, p: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  const t = len2 < EPSILON ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.z - a.z) * dz) / len2));
  return dist({ x: a.x + dx * t, z: a.z + dz * t }, p);
}
