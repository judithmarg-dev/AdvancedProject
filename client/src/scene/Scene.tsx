import { Canvas } from "@react-three/fiber";
import { CAMERA_OFFSET, SPAWN } from "@office/shared";
import { Avatar } from "./Avatar";
import { Lighting } from "./Lighting";
import { Room } from "./Room";
import { usePlayerController } from "./usePlayerController";

/** Todo lo que necesita el bucle de fotogramas; vive dentro del lienzo. */
function World() {
  const player = usePlayerController();

  return (
    <>
      <Lighting />
      <Room />
      <Avatar player={player} />
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{
        position: [SPAWN.x, CAMERA_OFFSET.up, SPAWN.z + CAMERA_OFFSET.back],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#EFEADF"]} />
      <fog attach="fog" args={["#EFEADF", 28, 60]} />
      <World />
    </Canvas>
  );
}
