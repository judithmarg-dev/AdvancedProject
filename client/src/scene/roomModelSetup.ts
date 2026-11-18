import { Mesh, type Material, type Object3D } from "three";

/** Mallas que solo reciben sombra: proyectarla desde el suelo o las paredes oscurecería toda la sala. */
const RECEIVE_ONLY = /^(floor|rug|wall-)/;
/** Mallas fuera del juego de sombras (el cielo tras el ventanal). */
const NO_SHADOWS = /^window-/;

const materialsOf = (mesh: Mesh): Material[] => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);

/**
 * glTF no guarda sombras ni `depthWrite`: se restauran al cargar el modelo (spec 006 AC-1). Con un modelo ajeno
 * (exportado de Blender) las mallas sin esos nombres proyectan y reciben sombra.
 */
export function prepareRoomScene<T extends Object3D>(root: T): T {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const noShadows = NO_SHADOWS.test(object.name);
    object.receiveShadow = !noShadows;
    object.castShadow = !noShadows && !RECEIVE_ONLY.test(object.name);
    for (const material of materialsOf(object)) {
      if (material.transparent) material.depthWrite = false;
    }
  });
  return root;
}
