/** Lógica del aviso de controles, aparte del componente para poder probarla sin navegador. */

export const CONTROLS_HINT_TEXT = "WASD o flechas para moverte";
export const CONTROLS_HINT_DURATION_MS = 5000;
export const CONTROLS_HINT_FADE_MS = 800;

let shown = false;

/** Devuelve `true` solo la primera vez de la sesión: el aviso no reaparece (AC-17). */
export function claimControlsHint(): boolean {
  if (shown) return false;
  shown = true;
  return true;
}

/** Opacidad del aviso según los milisegundos transcurridos desde que apareció. */
export function hintOpacity(elapsedMs: number): number {
  if (elapsedMs >= CONTROLS_HINT_DURATION_MS) return 0;
  const fadeStart = CONTROLS_HINT_DURATION_MS - CONTROLS_HINT_FADE_MS;
  if (elapsedMs <= fadeStart) return 1;
  return (CONTROLS_HINT_DURATION_MS - elapsedMs) / CONTROLS_HINT_FADE_MS;
}

/** Solo para pruebas: olvida que el aviso ya se mostró. */
export function resetControlsHint(): void {
  shown = false;
}
