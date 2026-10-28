import { FURNITURE, ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS, WINDOW, type Box2 } from "@office/shared";
import { PALETTE, WALL_TRANSPARENT_OPACITY } from "./palette";

const halfW = ROOM_SIZE.width / 2;
const halfD = ROOM_SIZE.depth / 2;

/** Caja apoyada en el suelo que ocupa exactamente el área de un `Box2`. */
function BoxFromArea({ box, height, color, y = 0 }: { box: Box2; height: number; color: string; y?: number }) {
  const width = box.maxX - box.minX;
  const depth = box.maxZ - box.minZ;
  return (
    <mesh
      position={[(box.minX + box.maxX) / 2, y + height / 2, (box.minZ + box.maxZ) / 2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Walls() {
  const span = ROOM_SIZE.width + WALL_THICKNESS * 2;
  return (
    <>
      {/* norte, sur y oeste: macizas */}
      <mesh position={[0, WALL_HEIGHT / 2, -halfD - WALL_THICKNESS / 2]} receiveShadow>
        <boxGeometry args={[span, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />
      </mesh>
      <mesh position={[0, WALL_HEIGHT / 2, halfD + WALL_THICKNESS / 2]} receiveShadow>
        <boxGeometry args={[span, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial
          color={PALETTE.wallTransparent}
          roughness={0.95}
          transparent
          opacity={WALL_TRANSPARENT_OPACITY}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-halfW - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE.depth]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />
      </mesh>
      <EastWallWithWindow />
    </>
  );
}

/** Pared este: antepecho, dintel y dos jambas dejan el hueco del ventanal. */
function EastWallWithWindow() {
  const x = halfW + WALL_THICKNESS / 2;
  const windowWidth = WINDOW.maxZ - WINDOW.minZ;
  const windowCenterZ = (WINDOW.minZ + WINDOW.maxZ) / 2;
  const jambDepth = (ROOM_SIZE.depth - windowWidth) / 2;
  const material = <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />;

  return (
    <>
      <mesh position={[x, WINDOW.sillHeight / 2, windowCenterZ]} receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WINDOW.sillHeight, windowWidth]} />
        {material}
      </mesh>
      <mesh
        position={[x, (WINDOW.topHeight + WALL_HEIGHT) / 2, windowCenterZ]}
        receiveShadow
      >
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT - WINDOW.topHeight, windowWidth]} />
        {material}
      </mesh>
      <mesh position={[x, WALL_HEIGHT / 2, WINDOW.minZ - jambDepth / 2]} receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, jambDepth]} />
        {material}
      </mesh>
      <mesh position={[x, WALL_HEIGHT / 2, WINDOW.maxZ + jambDepth / 2]} receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, jambDepth]} />
        {material}
      </mesh>
      {/* cielo visible tras el hueco */}
      <mesh
        position={[x + 0.4, (WINDOW.sillHeight + WINDOW.topHeight) / 2, windowCenterZ]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[windowWidth, WINDOW.topHeight - WINDOW.sillHeight]} />
        <meshBasicMaterial color="#DCEBF7" side={2} />
      </mesh>
    </>
  );
}

/** Mesa: tablero y cuatro patas sobre el área de colisión del escritorio. */
function Desk({ box }: { box: Box2 }) {
  const height = 0.74;
  const legInset = 0.12;
  const legs = [
    [box.minX + legInset, box.minZ + legInset],
    [box.maxX - legInset, box.minZ + legInset],
    [box.minX + legInset, box.maxZ - legInset],
    [box.maxX - legInset, box.maxZ - legInset],
  ] as const;

  return (
    <group>
      <BoxFromArea box={box} height={0.06} color={PALETTE.wood} y={height} />
      {legs.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, height / 2, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, height, 10]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />
        </mesh>
      ))}
      {/* portátil */}
      <group position={[(box.minX + box.maxX) / 2, height + 0.06, (box.minZ + box.maxZ) / 2]}>
        <mesh position={[0, 0.01, 0.1]} castShadow>
          <boxGeometry args={[0.42, 0.02, 0.3]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.14, -0.05]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.28, 0.02]} />
          <meshStandardMaterial color={PALETTE.metal} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/** Silla de oficina: asiento, respaldo y pie. */
function Chair({ box }: { box: Box2 }) {
  const centerX = (box.minX + box.maxX) / 2;
  const centerZ = (box.minZ + box.maxZ) / 2;
  const width = box.maxX - box.minX;

  return (
    <group position={[centerX, 0, centerZ]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[width * 0.45, width * 0.5, 0.1, 12]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color={PALETTE.metal} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.12, box.maxZ - box.minZ]} />
        <meshStandardMaterial color={PALETTE.sage} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.85, (box.maxZ - box.minZ) / 2 - 0.06]} castShadow>
        <boxGeometry args={[width, 0.55, 0.12]} />
        <meshStandardMaterial color={PALETTE.sage} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Mueble bajo con dos huecos y libros. */
function Cabinet({ box }: { box: Box2 }) {
  const height = 0.8;
  const centerX = (box.minX + box.maxX) / 2;
  const centerZ = (box.minZ + box.maxZ) / 2;

  return (
    <group>
      <BoxFromArea box={box} height={height} color={PALETTE.wall} />
      <mesh position={[centerX, height + 0.02, centerZ]} receiveShadow>
        <boxGeometry args={[box.maxX - box.minX + 0.08, 0.05, box.maxZ - box.minZ + 0.08]} />
        <meshStandardMaterial color={PALETTE.wallShade} roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[box.minX + 0.6 + i * 0.12, height + 0.17, centerZ + 0.1]} castShadow>
          <boxGeometry args={[0.07, 0.26, 0.2]} />
          <meshStandardMaterial color={i % 2 === 0 ? PALETTE.sageLight : PALETTE.wood} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Planta en maceta: tiesto cilíndrico y copa de esferas. */
function Plant({ box }: { box: Box2 }) {
  const centerX = (box.minX + box.maxX) / 2;
  const centerZ = (box.minZ + box.maxZ) / 2;
  const radius = Math.min(box.maxX - box.minX, box.maxZ - box.minZ) / 2;

  return (
    <group position={[centerX, 0, centerZ]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.85, radius * 0.7, 0.44, 16]} />
        <meshStandardMaterial color={PALETTE.pot} roughness={0.9} />
      </mesh>
      {[
        [0, 0.72, 0, 0.3],
        [radius * 0.6, 0.62, radius * 0.3, 0.22],
        [-radius * 0.5, 0.66, -radius * 0.4, 0.2],
      ].map(([x, y, z, r]) => (
        <mesh key={`${x}:${z}`} position={[x!, y!, z!]} castShadow>
          <sphereGeometry args={[r!, 16, 12]} />
          <meshStandardMaterial color={PALETTE.leaf} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Sala: suelo, alfombra, paredes con ventanal y mobiliario.
 * Cada mueble se dibuja sobre su caja de colisión de `FURNITURE`, así nunca hay
 * discrepancia entre lo que se ve y lo que detiene al avatar (AC-10).
 */
export function Room() {
  const [desk, chair, cabinet, plantA, plantB] = FURNITURE;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE.width, ROOM_SIZE.depth]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.01, 2.5]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color={PALETTE.rug} roughness={1} />
      </mesh>

      <Walls />

      {desk && <Desk box={desk} />}
      {chair && <Chair box={chair} />}
      {cabinet && <Cabinet box={cabinet} />}
      {plantA && <Plant box={plantA} />}
      {plantB && <Plant box={plantB} />}
    </group>
  );
}
