import { ROOM_SIZE } from "@office/shared";

/**
 * Luz natural entrando por el ventanal del este, con relleno ambiental suave.
 * Una sola luz proyecta sombras para no castigar los fotogramas (AC-14).
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.85} color="#FFF8EC" />
      <hemisphereLight args={["#FFFBF2", "#D8D2C4", 0.6]} />
      <directionalLight
        position={[ROOM_SIZE.width * 0.6, 7, 2]}
        intensity={1.5}
        color="#FFF3DC"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-ROOM_SIZE.width}
        shadow-camera-right={ROOM_SIZE.width}
        shadow-camera-top={ROOM_SIZE.depth}
        shadow-camera-bottom={-ROOM_SIZE.depth}
      />
    </>
  );
}
