import { describe, expect, it } from "vitest";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import { buildRoom } from "./roomModel";
import { prepareRoomScene } from "./roomModelSetup";

/** Como llega del GLB: sin sombras y con escritura de profundidad por defecto. */
function asLoaded(root: Object3D) {
  root.traverse((o) => {
    if (o instanceof Mesh) {
      o.castShadow = false;
      o.receiveShadow = false;
      (o.material as MeshStandardMaterial).depthWrite = true;
    }
  });
  return root;
}

const meshNamed = (root: Object3D, name: string) => root.getObjectByName(name) as Mesh;

describe("preparación del modelo cargado (spec 006 AC-1)", () => {
  const room = prepareRoomScene(asLoaded(buildRoom()));

  it("suelo, alfombra y paredes reciben sombra pero no la proyectan", () => {
    for (const name of ["floor", "rug", "wall-north-body", "wall-east-sill"]) {
      expect(meshNamed(room, name).receiveShadow, name).toBe(true);
      expect(meshNamed(room, name).castShadow, name).toBe(false);
    }
  });

  it("los muebles proyectan y reciben sombra", () => {
    for (const name of ["desk-top", "chair-seat", "cabinet-body", "plant-a-pot"]) {
      expect(meshNamed(room, name).castShadow, name).toBe(true);
      expect(meshNamed(room, name).receiveShadow, name).toBe(true);
    }
  });

  it("la pared semitransparente no escribe profundidad y el cielo no participa en sombras", () => {
    expect((meshNamed(room, "wall-south-glass").material as MeshStandardMaterial).depthWrite).toBe(false);
    expect(meshNamed(room, "window-sky").castShadow).toBe(false);
    expect(meshNamed(room, "window-sky").receiveShadow).toBe(false);
  });

  it("funciona con un modelo ajeno sin esos nombres (sustitución desde Blender, AC-5)", () => {
    const other = new Mesh(undefined, new MeshStandardMaterial({ transparent: true, opacity: 0.5 }));
    other.name = "Cube.001";
    prepareRoomScene(other);
    expect(other.castShadow).toBe(true);
    expect((other.material as MeshStandardMaterial).depthWrite).toBe(false);
  });
});
