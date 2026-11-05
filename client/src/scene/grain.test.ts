import { describe, expect, it } from "vitest";
import { GRAIN_FLOOR, grainPixels } from "./grain";

const SIZE = 64;

/** Valores de gris (canal R) de cada píxel RGBA. */
const greys = (pixels: Uint8Array) => Array.from({ length: SIZE * SIZE }, (_, i) => pixels[i * 4]!);

describe("grano del avatar (AC-21)", () => {
  it("es determinista: la misma semilla da la misma textura", () => {
    expect(grainPixels(SIZE, 7)).toEqual(grainPixels(SIZE, 7));
  });

  it("tiene el tamaño de una textura RGBA cuadrada", () => {
    expect(grainPixels(SIZE, 1)).toHaveLength(SIZE * SIZE * 4);
  });

  it("es gris y opaco, así que conserva el color del avatar", () => {
    const pixels = grainPixels(SIZE, 1);
    for (let i = 0; i < SIZE * SIZE; i++) {
      expect(pixels[i * 4 + 1]).toBe(pixels[i * 4]);
      expect(pixels[i * 4 + 2]).toBe(pixels[i * 4]);
      expect(pixels[i * 4 + 3]).toBe(255);
    }
  });

  it("es claro: ningún grano oscurece el color por debajo del suelo", () => {
    expect(Math.min(...greys(grainPixels(SIZE, 1)))).toBeGreaterThanOrEqual(GRAIN_FLOOR);
  });

  it("tiene variación: se percibe como grano, no como un tono plano", () => {
    const values = greys(grainPixels(SIZE, 1));
    const distinct = new Set(values).size;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const spread = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

    expect(distinct).toBeGreaterThan(20);
    expect(spread).toBeGreaterThan(8);
  });
});
