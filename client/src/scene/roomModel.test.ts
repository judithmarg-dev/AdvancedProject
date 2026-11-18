import { describe, expect, it } from "vitest";
import { Box3, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { FURNITURE, ROOM_SIZE, WALL_HEIGHT } from "@office/shared";
import { WALL_TRANSPARENT_OPACITY } from "./palette";
import { FURNITURE_NAMES, buildRoom } from "./roomModel";

const footprint = (object: Object3D) => {
  object.updateWorldMatrix(true, true);
  return new Box3().setFromObject(object);
};

describe("modelo de la sala (spec 006 AC-1)", () => {
  const room = buildRoom();

  it("tiene suelo del tamaño de la sala y alfombra", () => {
    const floor = room.getObjectByName("floor")!;
    const box = footprint(floor);
    expect(box.max.x - box.min.x).toBeCloseTo(ROOM_SIZE.width);
    expect(box.max.z - box.min.z).toBeCloseTo(ROOM_SIZE.depth);
    expect(room.getObjectByName("rug")).toBeInstanceOf(Mesh);
  });

  it("tiene las cuatro paredes a la altura de la sala, con la sur semitransparente", () => {
    for (const name of ["wall-north", "wall-south", "wall-west", "wall-east"]) {
      const wall = room.getObjectByName(name)!;
      expect(wall, name).toBeDefined();
      expect(footprint(wall).max.y).toBeCloseTo(WALL_HEIGHT);
    }
    const south = room.getObjectByName("wall-south-glass") as Mesh;
    const material = south.material as MeshStandardMaterial;
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBeCloseTo(WALL_TRANSPARENT_OPACITY);
    expect(room.getObjectByName("window-sky")).toBeInstanceOf(Mesh);
  });

  it("dibuja cada mueble centrado sobre su caja de colisión (spec 002 AC-10)", () => {
    expect(FURNITURE_NAMES).toHaveLength(FURNITURE.length);
    FURNITURE.forEach((area, i) => {
      const name = FURNITURE_NAMES[i]!;
      const group = room.getObjectByName(name);
      expect(group, name).toBeDefined();
      const box = footprint(group!);
      expect((box.min.x + box.max.x) / 2, name).toBeCloseTo((area.minX + area.maxX) / 2, 1);
      expect((box.min.z + box.max.z) / 2, name).toBeCloseTo((area.minZ + area.maxZ) / 2, 0);
    });
  });

  it("el tablero de la mesa y el cuerpo del mueble coinciden con su caja de colisión", () => {
    for (const [name, area] of [
      ["desk-top", FURNITURE[0]!],
      ["cabinet-body", FURNITURE[2]!],
    ] as const) {
      const box = footprint(room.getObjectByName(name)!);
      expect(box.min.x).toBeCloseTo(area.minX);
      expect(box.max.x).toBeCloseTo(area.maxX);
      expect(box.min.z).toBeCloseTo(area.minZ);
      expect(box.max.z).toBeCloseTo(area.maxZ);
    }
  });

  it("todas las mallas tienen nombre, para poder identificarlas al cargar el modelo", () => {
    room.traverse((object) => {
      if (object instanceof Mesh) expect(object.name).not.toBe("");
    });
  });
});
