import { useEffect, useMemo, useState } from "react";
import type { Group, Object3D } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildRoom } from "./roomModel";
import { prepareRoomScene } from "./roomModelSetup";

/** Modelo de la sala (spec 006): glTF binario con Draco; se sustituye por la exportación de Blender. */
const MODEL_URL = `${import.meta.env.BASE_URL}models/office.glb`;

let modelPromise: Promise<Group> | null = null;

/** Descarga el modelo una sola vez por página (el modo estricto de React monta dos veces). */
function loadRoomModel(): Promise<Group> {
  if (!modelPromise) {
    // Three empaqueta su decodificador Draco con la página: funciona sin CDN ni internet.
    const draco = new DRACOLoader();
    const loader = new GLTFLoader().setDRACOLoader(draco);
    modelPromise = loader.loadAsync(MODEL_URL).then((gltf) => {
      draco.dispose();
      return prepareRoomScene(gltf.scene);
    });
    modelPromise.catch(() => (modelPromise = null));
  }
  return modelPromise;
}

/**
 * Sala: el modelo `office.glb` cuando está listo; mientras carga, o si falla, la sala básica dibujada por
 * código con las mismas medidas (spec 006 AC-1, AC-3, AC-4). Las colisiones salen siempre de
 * `shared/world.ts` (spec 002 AC-10).
 */
export function Room() {
  const fallback = useMemo<Object3D>(() => prepareRoomScene(buildRoom()), []);
  const [model, setModel] = useState<Object3D | null>(null);

  useEffect(() => {
    let active = true;
    loadRoomModel().then(
      (scene) => {
        if (!active) return;
        console.log("[escena] Modelo de la sala cargado");
        setModel(scene);
      },
      (err: unknown) => {
        if (active) console.warn("[escena] No se pudo cargar el modelo de la sala; se usa la sala básica", err);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return <primitive object={model ?? fallback} />;
}
