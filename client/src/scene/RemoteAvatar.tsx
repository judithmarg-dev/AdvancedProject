import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { remotePlayers } from "../net/remotePlayers";
import { Avatar, type AvatarMotion } from "./Avatar";

/** Suavizado de la velocidad estimada: la posición interpolada avanza a saltos de fotograma. */
const SPEED_SMOOTHING = 12;

/**
 * Avatar de otro participante: su pose sale del búfer interpolado (spec 003 AC-9) y la velocidad se deduce
 * de cuánto avanza, para que respire quieto y se balancee al andar como el propio (AC-11).
 */
export function RemoteAvatar({ id, name, color }: { id: string; name: string; color: string }) {
  const motion = useMemo<AvatarMotion>(() => {
    const pose = remotePlayers.sample(id, performance.now());
    return {
      position: { x: pose?.x ?? 0, z: pose?.z ?? 0 },
      angle: pose?.rotY ?? 0,
      speed: 0,
      acceleration: 0,
      elapsed: 0,
    };
  }, [id]);

  useFrame((_, delta) => {
    const pose = remotePlayers.sample(id, performance.now());
    if (!pose || delta <= 0) return;

    const step = Math.hypot(pose.x - motion.position.x, pose.z - motion.position.z);
    const previousSpeed = motion.speed;
    motion.speed += (step / delta - motion.speed) * Math.min(1, SPEED_SMOOTHING * delta);
    motion.acceleration = (motion.speed - previousSpeed) / delta;
    motion.position = { x: pose.x, z: pose.z };
    motion.angle = pose.rotY;
  });

  return <Avatar player={motion} name={name} color={color} />;
}
