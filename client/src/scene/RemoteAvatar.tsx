import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { remotePlayers } from "../net/remotePlayers";
import { createRemoteMotion, updateRemoteMotion, type RemoteMotion } from "../net/remoteMotion";
import { Avatar, type AvatarMotion } from "./Avatar";

/**
 * Avatar de otro participante: su pose sale del búfer interpolado (spec 003 AC-9) y la velocidad se deduce
 * de cuánto avanza, para que respire quieto y se balancee al andar como el propio (AC-11).
 */
export function RemoteAvatar({ id, name, color }: { id: string; name: string; color: string }) {
  const motion = useMemo<RemoteMotion & AvatarMotion>(
    () => ({ ...createRemoteMotion(remotePlayers.sample(id, performance.now())), elapsed: 0 }),
    [id],
  );

  useFrame((_, delta) => {
    const pose = remotePlayers.sample(id, performance.now());
    if (pose) updateRemoteMotion(motion, pose, delta);
  });

  return <Avatar player={motion} name={name} color={color} />;
}
