/**
 * Genera el modelo por defecto de la sala (spec 006): exporta `buildRoom()` a glTF binario, lo comprime con
 * Draco y lo deja en `client/public/models/office.glb`. El decodificador Draco del navegador lo empaqueta three con la página.
 *
 *   npm run model -w client
 *
 * Para usar una sala modelada en Blender, expórtala como glTF binario (.glb) con compresión Draco y guárdala
 * en la misma ruta; no hace falta ejecutar este script.
 */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, draco, prune, weld } from "@gltf-transform/functions";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { buildRoom } from "../src/scene/roomModel.ts";

const require = createRequire(import.meta.url);
const draco3d = require("draco3dgltf") as {
  createEncoderModule(): Promise<unknown>;
  createDecoderModule(): Promise<unknown>;
};

/** `GLTFExporter` usa `FileReader` (del navegador) para el binario; en Node basta con `Blob.arrayBuffer()`. */
class NodeFileReader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
}
(globalThis as { FileReader?: unknown }).FileReader ??= NodeFileReader;

const out = new URL("../public/models/office.glb", import.meta.url);

const room = buildRoom();
room.updateMatrixWorld(true);
const glb = await new GLTFExporter().parseAsync(room, { binary: true });

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.encoder": await draco3d.createEncoderModule(),
  "draco3d.decoder": await draco3d.createDecoderModule(),
});
const document = await io.readBinary(new Uint8Array(glb as ArrayBuffer));
await document.transform(dedup(), weld(), prune(), draco());

mkdirSync(new URL("./", out), { recursive: true });
writeFileSync(out, await io.writeBinary(document));
console.log(`[modelo] ${fileURLToPath(out)} (${(statSync(out).size / 1024).toFixed(1)} KB)`);
