import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  type BufferGeometry,
  type Material,
} from "three";
import { FURNITURE, ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS, WINDOW, type Box2 } from "@office/shared";
import { PALETTE, WALL_TRANSPARENT_OPACITY } from "./palette";

/** Nombre del grupo de cada mueble, en el orden de `FURNITURE`. */
export const FURNITURE_NAMES = ["desk", "chair", "cabinet", "plant-a", "plant-b"] as const;

const halfW = ROOM_SIZE.width / 2;
const halfD = ROOM_SIZE.depth / 2;

const standard = (color: string, roughness: number) => new MeshStandardMaterial({ color, roughness });

function mesh(
  name: string,
  geometry: BufferGeometry,
  material: Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): Mesh {
  const m = new Mesh(geometry, material);
  m.name = name;
  m.position.set(...position);
  m.rotation.set(...rotation);
  return m;
}

function group(name: string, children: Mesh[], position: [number, number, number] = [0, 0, 0]): Group {
  const g = new Group();
  g.name = name;
  g.position.set(...position);
  g.add(...children);
  return g;
}

/** Caja apoyada en el suelo que ocupa exactamente el área de un `Box2`. */
function boxFromArea(name: string, box: Box2, height: number, color: string, y = 0): Mesh {
  return mesh(
    name,
    new BoxGeometry(box.maxX - box.minX, height, box.maxZ - box.minZ),
    standard(color, 0.85),
    [(box.minX + box.maxX) / 2, y + height / 2, (box.minZ + box.maxZ) / 2],
  );
}

function walls(): Group[] {
  const span = ROOM_SIZE.width + WALL_THICKNESS * 2;
  const wall = standard(PALETTE.wall, 0.95);
  const glass = new MeshStandardMaterial({
    color: PALETTE.wallTransparent,
    roughness: 0.95,
    transparent: true,
    opacity: WALL_TRANSPARENT_OPACITY,
    depthWrite: false,
  });

  const x = halfW + WALL_THICKNESS / 2;
  const windowWidth = WINDOW.maxZ - WINDOW.minZ;
  const windowCenterZ = (WINDOW.minZ + WINDOW.maxZ) / 2;
  const jambDepth = (ROOM_SIZE.depth - windowWidth) / 2;

  return [
    group("wall-north", [
      mesh("wall-north-body", new BoxGeometry(span, WALL_HEIGHT, WALL_THICKNESS), wall, [0, WALL_HEIGHT / 2, -halfD - WALL_THICKNESS / 2]),
    ]),
    group("wall-south", [
      mesh("wall-south-glass", new BoxGeometry(span, WALL_HEIGHT, WALL_THICKNESS), glass, [0, WALL_HEIGHT / 2, halfD + WALL_THICKNESS / 2]),
    ]),
    group("wall-west", [
      mesh("wall-west-body", new BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE.depth), wall, [-halfW - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]),
    ]),
    // Pared este: antepecho, dintel y dos jambas dejan el hueco del ventanal.
    group("wall-east", [
      mesh("wall-east-sill", new BoxGeometry(WALL_THICKNESS, WINDOW.sillHeight, windowWidth), wall, [x, WINDOW.sillHeight / 2, windowCenterZ]),
      mesh(
        "wall-east-lintel",
        new BoxGeometry(WALL_THICKNESS, WALL_HEIGHT - WINDOW.topHeight, windowWidth),
        wall,
        [x, (WINDOW.topHeight + WALL_HEIGHT) / 2, windowCenterZ],
      ),
      mesh("wall-east-jamb-n", new BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, jambDepth), wall, [x, WALL_HEIGHT / 2, WINDOW.minZ - jambDepth / 2]),
      mesh("wall-east-jamb-s", new BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, jambDepth), wall, [x, WALL_HEIGHT / 2, WINDOW.maxZ + jambDepth / 2]),
    ]),
    // Cielo visible tras el hueco.
    group("window", [
      mesh(
        "window-sky",
        new PlaneGeometry(windowWidth, WINDOW.topHeight - WINDOW.sillHeight),
        new MeshBasicMaterial({ color: "#DCEBF7", side: DoubleSide }),
        [x + 0.4, (WINDOW.sillHeight + WINDOW.topHeight) / 2, windowCenterZ],
        [0, Math.PI / 2, 0],
      ),
    ]),
  ];
}

/** Mesa: tablero y cuatro patas sobre el área de colisión del escritorio, con un portátil. */
function desk(box: Box2): Group {
  const height = 0.74;
  const legInset = 0.12;
  const legMaterial = standard(PALETTE.woodDark, 0.8);
  const metal = standard(PALETTE.metal, 0.4);
  const legs = [
    [box.minX + legInset, box.minZ + legInset],
    [box.maxX - legInset, box.minZ + legInset],
    [box.minX + legInset, box.maxZ - legInset],
    [box.maxX - legInset, box.maxZ - legInset],
  ].map(([x, z], i) => mesh(`desk-leg-${i}`, new CylinderGeometry(0.035, 0.035, height, 10), legMaterial, [x!, height / 2, z!]));

  const cx = (box.minX + box.maxX) / 2;
  const cz = (box.minZ + box.maxZ) / 2;
  const laptop = [
    mesh("laptop-base", new BoxGeometry(0.42, 0.02, 0.3), metal, [cx, height + 0.06 + 0.01, cz + 0.1]),
    mesh("laptop-screen", new BoxGeometry(0.42, 0.28, 0.02), metal, [cx, height + 0.06 + 0.14, cz - 0.05], [-0.25, 0, 0]),
  ];
  return group("desk", [boxFromArea("desk-top", box, 0.06, PALETTE.wood, height), ...legs, ...laptop]);
}

/** Silla de oficina: asiento, respaldo y pie. */
function chair(box: Box2): Group {
  const width = box.maxX - box.minX;
  const depth = box.maxZ - box.minZ;
  const metal = standard(PALETTE.metal, 0.6);
  const fabric = standard(PALETTE.sage, 0.9);
  return group(
    "chair",
    [
      mesh("chair-base", new CylinderGeometry(width * 0.45, width * 0.5, 0.1, 12), metal, [0, 0.05, 0]),
      mesh("chair-post", new CylinderGeometry(0.05, 0.05, 0.4, 8), metal, [0, 0.3, 0]),
      mesh("chair-seat", new BoxGeometry(width, 0.12, depth), fabric, [0, 0.52, 0]),
      mesh("chair-back", new BoxGeometry(width, 0.55, 0.12), fabric, [0, 0.85, depth / 2 - 0.06]),
    ],
    [(box.minX + box.maxX) / 2, 0, (box.minZ + box.maxZ) / 2],
  );
}

/** Mueble bajo con encimera y libros. */
function cabinet(box: Box2): Group {
  const height = 0.8;
  const cx = (box.minX + box.maxX) / 2;
  const cz = (box.minZ + box.maxZ) / 2;
  const books = [0, 1, 2, 3].map((i) =>
    mesh(
      `cabinet-book-${i}`,
      new BoxGeometry(0.07, 0.26, 0.2),
      standard(i % 2 === 0 ? PALETTE.sageLight : PALETTE.wood, 0.9),
      [box.minX + 0.6 + i * 0.12, height + 0.17, cz + 0.1],
    ),
  );
  return group("cabinet", [
    boxFromArea("cabinet-body", box, height, PALETTE.wall),
    mesh(
      "cabinet-top",
      new BoxGeometry(box.maxX - box.minX + 0.08, 0.05, box.maxZ - box.minZ + 0.08),
      standard(PALETTE.wallShade, 0.9),
      [cx, height + 0.02, cz],
    ),
    ...books,
  ]);
}

/** Planta en maceta: tiesto cilíndrico y copa de esferas. */
function plant(name: string, box: Box2): Group {
  const radius = Math.min(box.maxX - box.minX, box.maxZ - box.minZ) / 2;
  const leaf = standard(PALETTE.leaf, 0.8);
  const crown = [
    [0, 0.72, 0, 0.3],
    [radius * 0.6, 0.62, radius * 0.3, 0.22],
    [-radius * 0.5, 0.66, -radius * 0.4, 0.2],
  ].map(([x, y, z, r], i) => mesh(`${name}-leaf-${i}`, new SphereGeometry(r!, 16, 12), leaf, [x!, y!, z!]));
  return group(
    name,
    [mesh(`${name}-pot`, new CylinderGeometry(radius * 0.85, radius * 0.7, 0.44, 16), standard(PALETTE.pot, 0.9), [0, 0.22, 0]), ...crown],
    [(box.minX + box.maxX) / 2, 0, (box.minZ + box.maxZ) / 2],
  );
}

/**
 * Sala completa en three puro: suelo, alfombra, paredes con ventanal y mobiliario. Cada mueble se dibuja sobre
 * su caja de colisión de `FURNITURE` (spec 002 AC-10). Es la sala de respaldo del cliente y la fuente del
 * modelo por defecto `office.glb` (spec 006).
 */
export function buildRoom(): Group {
  const room = new Group();
  room.name = "office";
  room.add(
    mesh("floor", new PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.depth), standard(PALETTE.floor, 0.95), [0, 0, 0], [-Math.PI / 2, 0, 0]),
    mesh("rug", new CircleGeometry(3.2, 48), standard(PALETTE.rug, 1), [-3.5, 0.01, 2.5], [-Math.PI / 2, 0, 0]),
    ...walls(),
  );
  const builders = [desk, chair, cabinet, (b: Box2) => plant("plant-a", b), (b: Box2) => plant("plant-b", b)];
  FURNITURE.forEach((box, i) => {
    const build = builders[i];
    if (build) room.add(build(box));
  });
  return room;
}
