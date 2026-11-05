import { Color } from "three";

/** Paleta tomada de la referencia visual (`shared/assets/Multimedia.jpeg`). */
export const PALETTE = {
  floor: "#EAE3D6",
  wall: "#F6F2E9",
  wallTransparent: "#899F9F",
  wallShade: "#EDE7DA",
  rug: "#D7DECB",
  wood: "#E9DCC2",
  woodDark: "#D9C8A8",
  sage: "#9FB38C",
  sageLight: "#C2CFB2",
  face: "#2F3A2C",
  leaf: "#7FA06A",
  pot: "#F2EDE3",
  metal: "#CFCABF",
} as const;

/** Tono algo más oscuro del color del avatar, para los pies (el color lo asigna el servidor, spec 003). */
export function shadeColor(hex: string, factor = 0.85): string {
  return `#${new Color(hex).multiplyScalar(factor).getHexString()}`;
}

/** Opacidad del muro acristalado que da al jugador: deja ver el avatar al entrar (AC-2). */
export const WALL_TRANSPARENT_OPACITY = 0.18;
