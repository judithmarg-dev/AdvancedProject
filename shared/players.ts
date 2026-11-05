/**
 * Reglas de los participantes (spec 003): nombre, capacidad y colores.
 * Las usa el servidor como autoridad; el cliente solo las repite como cortesía en la pantalla de entrada.
 */

export const MAX_PLAYERS = 20;
export const NAME_MAX_LENGTH = 20;

/** Nombre recortado si es válido (1–20 caracteres), o `null`. Cuenta caracteres, no unidades UTF-16. */
export function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  const length = [...name].length;
  return length >= 1 && length <= NAME_MAX_LENGTH ? name : null;
}

/** Paleta pastel acorde a la referencia visual; el verde de la spec 002 es un tono más. */
export const AVATAR_COLORS: readonly string[] = [
  "#ffc0ee", // melocotón
  "#A9CBE8", // azul cielo
  "#C6E89B", // verde pastel (spec 002)
  "#F3D98B", // amarillo mantequilla
  "#CDB8E6", // lavanda
  "#9FD8CB", // menta
  "#F2B5CF", // rosa
  "#7bb588", // salvia clara
  "#F6C99A", // albaricoque
  "#AEB9EC", // pervinca
  "#E3C6A8", // arena
  "#A6E0E3", // aguamarina
  "#E8A9A9", // coral suave
  "#D9E39A", // lima suave
  "#C2A9D9", // malva
  "#9CC9B0", // eucalipto
  "#F0BFA0", // salmón
  "#B6C9D6", // gris azulado
  "#E6CFE8", // lila claro
  "#D4C08F", // mostaza suave
];

/** Primer color de la paleta que no está en uso; si todos lo están, el primero. */
export function pickColor(used: Iterable<string>): string {
  const taken = new Set(used);
  return AVATAR_COLORS.find((color) => !taken.has(color)) ?? AVATAR_COLORS[0]!;
}
