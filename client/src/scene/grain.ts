import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearSRGBColorSpace,
  RepeatWrapping,
  RGBAFormat,
} from "three";

/** Gris mínimo del grano (0–255): por encima, el color del avatar apenas se oscurece (AC-21). */
export const GRAIN_FLOOR = 215;
const GRAIN_SIZE = 128;
/** Veces que se repite la textura sobre cada pieza: grano fino, no manchas. */
const GRAIN_REPEAT = 4;

/** Generador pseudoaleatorio pequeño y determinista (mulberry32). */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Píxeles RGBA de ruido gris claro, entre `GRAIN_FLOOR` y 255 (spec 003 AC-21). */
export function grainPixels(size: number, seed: number): Uint8Array {
  const next = random(seed);
  const pixels = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const grey = GRAIN_FLOOR + Math.round(next() * (255 - GRAIN_FLOOR));
    pixels.set([grey, grey, grey, 255], i * 4);
  }
  return pixels;
}

let texture: DataTexture | null = null;

/**
 * Textura de grano compartida por todos los avatares; se crea una vez. Se usa como `map` (multiplica el
 * color), `roughnessMap` (el brillo varía grano a grano) y `bumpMap` (relieve que capta la luz). Lineal: el
 * gris multiplica tal cual. Con mipmaps, para que no centellee de lejos.
 */
export function avatarGrainTexture(): DataTexture {
  if (texture) return texture;
  texture = new DataTexture(grainPixels(GRAIN_SIZE, 2026), GRAIN_SIZE, GRAIN_SIZE, RGBAFormat);
  texture.colorSpace = LinearSRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(GRAIN_REPEAT, GRAIN_REPEAT);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
