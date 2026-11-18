import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MOVE_SPEED, moveAvatar, type Vec2 } from "@office/shared";
import { remotePlayers } from "../net/remotePlayers";
import type { OfficeSession } from "../net/office";
import { createSendPolicy } from "../net/sendPolicy";
import { selfPose } from "../net/selfPose";
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
 * Bucle de movimiento del jugador local: teclado → velocidad → colisiones (muebles y demás avatares, tal
 * como se ven en pantalla, spec 003 AC-22) → cámara → envío al servidor.
 * El movimiento se aplica en local sin esperar respuesta (spec 003 AC-12); el servidor solo corrige.
 * Trabaja sobre un objeto mutable (no estado de React) para no renderizar por fotograma.
 */
export function usePlayerController(session: OfficeSession, spawn: Vec2): PlayerState {
  const player = useMemo<PlayerState>(
    () => ({
      position: { ...spawn },
      velocity: { x: 0, z: 0 },
      angle: 0,
      speed: 0,
      acceleration: 0,
      elapsed: 0,
    }),
    // La posición inicial solo cuenta al montar: luego manda el bucle.
    [],
  );

  const input = useMemo(
    () => (typeof window === "undefined" ? null : createKeyboardInput(window)),
    [],
  );
  useEffect(() => () => input?.dispose(), [input]);
  // Fuera de la sala no hay posición propia para el volumen por proximidad (spec 005).
  useEffect(() => () => void (selfPose.current = null), []);

  const sendPolicy = useMemo(() => createSendPolicy({ ...player.position, rotY: player.angle }), [player]);

  // Corrección del servidor: se aplica de inmediato, sin transición (spec 003 AC-13).
  useEffect(() => {
    session.onCorrection((correction) => {
      player.position = { x: correction.x, z: correction.z };
      player.velocity = { x: 0, z: 0 };
      player.speed = 0;
      sendPolicy.reset({ ...player.position, rotY: player.angle });
    });
    return () => session.onCorrection(() => {});
  }, [session, player, sendPolicy]);

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

    player.position = moveAvatar(
      player.position,
      { x: player.velocity.x * dt, z: player.velocity.z * dt },
      remotePlayers.positions(performance.now()),
    );

    selfPose.current = player.position;

    if (direction.x !== 0 || direction.z !== 0) {
      player.angle = turnToward(player.angle, angleFromDirection(direction), dt);
    }

    const move = sendPolicy.update(performance.now(), { ...player.position, rotY: player.angle });
    if (move) session.sendMove(move);

    cameraPosition.current = followCamera(cameraPosition.current, desiredCameraPosition(player.position), dt);
    camera.position.set(cameraPosition.current.x, cameraPosition.current.y, cameraPosition.current.z);
    const target = cameraLookAt(player.position);
    camera.lookAt(target.x, target.y, target.z);
  });

  return player;
}
