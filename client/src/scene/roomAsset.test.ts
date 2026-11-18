import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MODEL = new URL("../../public/models/office.glb", import.meta.url);

/** JSON de un glTF binario: cabecera de 12 bytes y primer bloque (tipo JSON). */
function gltfJson(bytes: Buffer): { extensionsUsed?: string[]; nodes?: { name?: string }[] } {
  const length = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"));
}

describe("modelo de la sala como archivo (spec 006 AC-2, AC-5)", () => {
  it("existe en la carpeta documentada y pesa menos de 5 MB", () => {
    expect(existsSync(MODEL)).toBe(true);
    expect(statSync(MODEL).size).toBeLessThan(5 * 1024 * 1024);
  });

  it("es glTF binario comprimido con Draco", () => {
    const bytes = readFileSync(MODEL);
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("glTF");
    expect(gltfJson(bytes).extensionsUsed).toContain("KHR_draco_mesh_compression");
  });

  it("conserva los nombres de las piezas de la sala", () => {
    const names = (gltfJson(readFileSync(MODEL)).nodes ?? []).map((n) => n.name);
    for (const name of ["floor", "rug", "wall-south-glass", "window-sky", "desk-top", "cabinet-body"]) {
      expect(names).toContain(name);
    }
  });
});
