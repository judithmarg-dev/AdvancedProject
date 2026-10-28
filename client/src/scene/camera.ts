import { CAMERA_OFFSET, CAMERA_SMOOTHING, CAMERA_TARGET_HEIGHT, type Vec2 } from "@office/shared";

export type Vec3 = { x: number; y: number; z: number };

/**
 * Cámara en tercera persona de orientación fija: siempre detrás (+Z) y encima del avatar.
 * Al no haber control por ratón en esta fase, mover "adelante" equivale a alejarse de la cámara.
 */
export function desiredCameraPosition(avatar: Vec2): Vec3 {
  return { x: avatar.x, y: CAMERA_OFFSET.up, z: avatar.z + CAMERA_OFFSET.back };
}

export function cameraLookAt(avatar: Vec2): Vec3 {
  return { x: avatar.x, y: CAMERA_TARGET_HEIGHT, z: avatar.z };
}

/**
 * Amortiguación exponencial hacia el encuadre deseado: suave, sin saltos y sin sobrepasarlo.
 * El factor depende de `dt`, así que el resultado no cambia con la tasa de fotogramas.
 */
export function followCamera(current: Vec3, desired: Vec3, dt: number): Vec3 {
  const t = 1 - Math.exp(-CAMERA_SMOOTHING * dt);
  return {
    x: current.x + (desired.x - current.x) * t,
    y: current.y + (desired.y - current.y) * t,
    z: current.z + (desired.z - current.z) * t,
  };
}
