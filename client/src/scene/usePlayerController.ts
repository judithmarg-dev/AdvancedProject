import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AVATAR, MOVE_SPEED, OBSTACLES, SPAWN, resolveMovement, type Vec2 } from "@office/shared";
import { createKeyboardInput } from "./input";
import { angleFromDirection, stepVelocity, turnToward } from "./movement";
import { cameraLookAt, desiredCameraPosition, followCamera, type Vec3 } from "./camera";

export type PlayerState = {
  position: Vec2;
  velocity: Vec2;
  /** Hacia dónde mira el avatar (rad). */
  angle: number;
  /** Módulo de la velocidad (m/s). */
  speed: number;
  /** Cambio de velocidad del último fotograma (m/s²), para el squash and stretch. */
  acceleration: number;
  /** Tiempo acumulado, base de las animaciones. */
  elapsed: number;
};

/** Tope del paso de tiempo: tras volver de otra pestaña el delta puede ser enorme. */
const MAX_DELTA = 1 / 20;

/**
 * Bucle de movimiento del jugador local: teclado → velocidad → colisiones → cámara.
 * Trabaja sobre un objeto mutable (no estado de React) para no renderizar por fotograma.
 */
export function usePlayerController(): PlayerState {
  const player = useMemo<PlayerState>(
    () => ({
      position: { ...SPAWN },
      velocity: { x: 0, z: 0 },
      angle: 0,
      speed: 0,
      acceleration: 0,
      elapsed: 0,
    }),
    [],
  );

  const input = useMemo(
    () => (typeof window === "undefined" ? null : createKeyboardInput(window)),
    [],
  );
  useEffect(() => () => input?.dispose(), [input]);

  const camera = useThree((state) => state.camera);
  const cameraPosition = useRef<Vec3>(desiredCameraPosition(player.position));

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, MAX_DELTA);
    const direction = input?.direction() ?? { x: 0, z: 0 };
    const desired = { x: direction.x * MOVE_SPEED, z: direction.z * MOVE_SPEED };

    const previousSpeed = player.speed;
    player.velocity = stepVelocity(player.velocity, desired, dt);
    player.speed = Math.hypot(player.velocity.x, player.velocity.z);
    player.acceleration = dt > 0 ? (player.speed - previousSpeed) / dt : 0;

    player.position = resolveMovement(
      player.position,
      { x: player.velocity.x * dt, z: player.velocity.z * dt },
      AVATAR.radius,
      OBSTACLES,
    );

    if (direction.x !== 0 || direction.z !== 0) {
      player.angle = turnToward(player.angle, angleFromDirection(direction), dt);
    }

    cameraPosition.current = followCamera(cameraPosition.current, desiredCameraPosition(player.position), dt);
    camera.position.set(cameraPosition.current.x, cameraPosition.current.y, cameraPosition.current.z);
    const target = cameraLookAt(player.position);
    camera.lookAt(target.x, target.y, target.z);
  });

  return player;
}
