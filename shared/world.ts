/**
 * Medidas del mundo y resolución de colisiones (spec 002).
 * Viven en `shared/` porque el servidor validará posiciones con los mismos números (spec 003).
 */

export type Vec2 = { x: number; z: number };

/** Caja alineada a los ejes, en el plano del suelo. */
export type Box2 = { minX: number; maxX: number; minZ: number; maxZ: number };

export const ROOM_SIZE = { width: 16, depth: 12 } as const;
export const WALL_HEIGHT = 3;
export const WALL_THICKNESS = 0.2;

/** Hueco del ventanal en la pared este, en coordenadas z. */
export const WINDOW = { minZ: -4, maxZ: 4, sillHeight: 0.6, topHeight: 2.6 } as const;

export const AVATAR = { height: 1, radius: 0.35 } as const;
/** Punto de entrada: cerca del lado sur y libre del escritorio y de la silla. */
export const SPAWN: Vec2 = { x: -2, z: 4.5 };

/** Velocidad máxima (m/s) y rampas: a 30 m/s² el frenado completo dura 0,1 s (< 0,2 s, AC-4). */
export const MOVE_SPEED = 3;
export const ACCELERATION = 30;
export const DECELERATION = 30;
/** Velocidad angular máxima (rad/s): 180° en ~0,26 s (< 0,3 s, AC-6). */
export const TURN_SPEED = 12;

/** Cámara en tercera persona: 6 m por detrás, 4 m por encima, con suavizado exponencial. */
export const CAMERA_OFFSET = { back: 6, up: 4 } as const;
export const CAMERA_SMOOTHING = 6;
export const CAMERA_TARGET_HEIGHT = AVATAR.height * 0.7;

const halfW = ROOM_SIZE.width / 2;
const halfD = ROOM_SIZE.depth / 2;

/** Las cuatro paredes, por fuera del interior de la sala. */
export const WALLS: readonly Box2[] = [
  { minX: -halfW - WALL_THICKNESS, maxX: halfW + WALL_THICKNESS, minZ: -halfD - WALL_THICKNESS, maxZ: -halfD }, // norte
  { minX: -halfW - WALL_THICKNESS, maxX: halfW + WALL_THICKNESS, minZ: halfD, maxZ: halfD + WALL_THICKNESS }, // sur
  { minX: -halfW - WALL_THICKNESS, maxX: -halfW, minZ: -halfD, maxZ: halfD }, // oeste
  { minX: halfW, maxX: halfW + WALL_THICKNESS, minZ: -halfD, maxZ: halfD }, // este (ventanal)
];

/** Mobiliario: escritorio con silla junto al ventanal, mueble bajo y dos plantas. */
export const FURNITURE: readonly Box2[] = [
  { minX: 0.2, maxX: 3.4, minZ: 1.2, maxZ: 2.8 }, // escritorio
  { minX: 0.4, maxX: 1.4, minZ: 3.4, maxZ: 4.4 }, // silla
  { minX: -6, maxX: -1, minZ: -6, maxZ: -5.1 }, // mueble bajo
  { minX: -6.6, maxX: -5.8, minZ: -3.6, maxZ: -2.8 }, // planta junto al mueble
  { minX: 6.4, maxX: 7.2, minZ: 3.2, maxZ: 4 }, // planta junto al escritorio
];

export const OBSTACLES: readonly Box2[] = [...WALLS, ...FURNITURE];

/** Margen para que el avatar quede en contacto con la caja, nunca dentro de ella. */
const CONTACT_EPSILON = 1e-4;

function expand(box: Box2, radius: number): Box2 {
  return {
    minX: box.minX - radius,
    maxX: box.maxX + radius,
    minZ: box.minZ - radius,
    maxZ: box.maxZ + radius,
  };
}

/** ¿El avatar (círculo aproximado por su radio) solapa alguna caja? El contacto exacto no cuenta. */
export function collides(position: Vec2, radius: number, boxes: readonly Box2[]): boolean {
  return boxes.some((box) => {
    const e = expand(box, radius);
    return position.x > e.minX && position.x < e.maxX && position.z > e.minZ && position.z < e.maxZ;
  });
}

/** Desplazamiento en un eje, recortado al primer obstáculo que lo cruce. */
function sweep(from: number, delta: number, other: number, radius: number, boxes: readonly Box2[], axis: "x" | "z"): number {
  if (delta === 0) return from;
  let result = from + delta;

  for (const box of boxes) {
    const e = expand(box, radius);
    const [minMove, maxMove, minOther, maxOther] =
      axis === "x" ? [e.minX, e.maxX, e.minZ, e.maxZ] : [e.minZ, e.maxZ, e.minX, e.maxX];

    // Solo estorban las cajas que el avatar cruza en el otro eje.
    if (other <= minOther || other >= maxOther) continue;

    if (delta > 0 && from <= minMove && result > minMove) {
      result = Math.min(result, minMove - CONTACT_EPSILON);
    } else if (delta < 0 && from >= maxMove && result < maxMove) {
      result = Math.max(result, maxMove + CONTACT_EPSILON);
    }
  }

  return result;
}

/**
 * Aplica `delta` a `position` resolviendo cada eje por separado: el eje bloqueado se detiene en el
 * contacto y el libre conserva su avance, de modo que el avatar se desliza a lo largo de la pared.
 */
export function resolveMovement(position: Vec2, delta: Vec2, radius: number, boxes: readonly Box2[] = OBSTACLES): Vec2 {
  const x = sweep(position.x, delta.x, position.z, radius, boxes, "x");
  const z = sweep(position.z, delta.z, x, radius, boxes, "z");
  return { x, z };
}
