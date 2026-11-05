import type { PlayerPose } from "./interpolation";

/**
 * Ventana sobre la que se mide la velocidad (s). Las instantáneas llegan cada 50 o 100 ms (parches del
 * servidor a 20 Hz frente a envíos a 12 Hz), así que la velocidad fotograma a fotograma oscila mucho; medida
 * sobre varias instantáneas es estable (spec 003 AC-9).
 */
const SPEED_WINDOW = 0.3;
/** Suavizado final de la velocidad (1/s), para que la aceleración, y con ella el squash, no tiemble. */
const SPEED_SMOOTHING = 6;
/** Suavizado de la aceleración (1/s): el squash responde a arranques y frenadas, no al rizado residual. */
const ACCELERATION_SMOOTHING = 10;

type Sample = { time: number; x: number; z: number };

/** Movimiento de otro participante deducido de su pose interpolada fotograma a fotograma. */
export type RemoteMotion = {
  position: { x: number; z: number };
  angle: number;
  speed: number;
  acceleration: number;
  /** Reloj propio y posiciones recientes, para medir la velocidad sobre la ventana. */
  time: number;
  history: Sample[];
};

export function createRemoteMotion(pose: PlayerPose | null): RemoteMotion {
  const x = pose?.x ?? 0;
  const z = pose?.z ?? 0;
  return {
    position: { x, z },
    angle: pose?.rotY ?? 0,
    speed: 0,
    acceleration: 0,
    time: 0,
    history: [{ time: 0, x, z }],
  };
}

/** Avanza `motion` hasta `pose`, estimando velocidad y aceleración para las animaciones (AC-9, AC-11). */
export function updateRemoteMotion(motion: RemoteMotion, pose: PlayerPose, delta: number): void {
  if (delta <= 0) return;
  motion.time += delta;
  motion.history.push({ time: motion.time, x: pose.x, z: pose.z });
  while (motion.history.length > 2 && motion.time - motion.history[1]!.time >= SPEED_WINDOW) {
    motion.history.shift();
  }

  const oldest = motion.history[0]!;
  const span = Math.max(motion.time - oldest.time, delta);
  const measured = Math.hypot(pose.x - oldest.x, pose.z - oldest.z) / span;

  const previousSpeed = motion.speed;
  motion.speed += (measured - motion.speed) * Math.min(1, SPEED_SMOOTHING * delta);
  const measuredAcceleration = (motion.speed - previousSpeed) / delta;
  motion.acceleration += (measuredAcceleration - motion.acceleration) * Math.min(1, ACCELERATION_SMOOTHING * delta);
  motion.position = { x: pose.x, z: pose.z };
  motion.angle = pose.rotY;
}
