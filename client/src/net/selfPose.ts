import type { Vec2 } from "@office/shared";

/**
 * Posición propia tal como se ve en pantalla, fuera de React: la escribe el controlador del jugador en cada
 * fotograma y la lee el canal de voz para calcular volúmenes (spec 005).
 */
export const selfPose: { current: Vec2 | null } = { current: null };
