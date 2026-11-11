import { Canvas } from "@react-three/fiber";
import { CAMERA_OFFSET, SPAWN } from "@office/shared";
import type { OfficeSession } from "../net/office";
import { useSession, type SelfInfo } from "../store/session";
import { Avatar } from "./Avatar";
import { Lighting } from "./Lighting";
import { RemoteAvatar } from "./RemoteAvatar";
import { Room } from "./Room";
import { usePlayerController } from "./usePlayerController";

/** Avatar propio: solo existe dentro de la sala; cada entrada empieza donde lo coloca el servidor (AC-24). */
function LocalPlayer({ session, self }: { session: OfficeSession; self: SelfInfo }) {
  const player = usePlayerController(session, self.spawn);
  return <Avatar id={session.sessionId} player={player} name={self.name} color={self.color} />;
}

/** Todo lo que necesita el bucle de fotogramas; vive dentro del lienzo. */
function World({ session }: { session: OfficeSession | null }) {
  const self = useSession((state) => state.self);
  const remotes = useSession((state) => state.remotes);

  return (
    <>
      <Lighting />
      <Room />
      {session && self && <LocalPlayer session={session} self={self} />}
      {Object.entries(remotes).map(([id, remote]) => (
        <RemoteAvatar key={id} id={id} name={remote.name} color={remote.color} />
      ))}
    </>
  );
}

/** La sala se ve siempre; fuera de ella (pantalla de entrada) se muestra atenuada y sin avatares (spec 003 AC-1). */
export function Scene({ session, dimmed }: { session: OfficeSession | null; dimmed: boolean }) {
  return (
    <div className={dimmed ? "scene scene--dimmed" : "scene"}>
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
        <World session={session} />
      </Canvas>
    </div>
  );
}
