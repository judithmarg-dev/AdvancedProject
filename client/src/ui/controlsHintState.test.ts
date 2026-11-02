import { beforeEach, describe, expect, it } from "vitest";
import {
  CONTROLS_HINT_DURATION_MS,
  CONTROLS_HINT_FADE_MS,
  claimControlsHint,
  hintOpacity,
  resetControlsHint,
} from "./controlsHintState";

beforeEach(() => resetControlsHint());

describe("aviso de controles (AC-17)", () => {
  it("se muestra la primera vez de la sesión", () => {
    expect(claimControlsHint()).toBe(true);
  });

  it("no vuelve a mostrarse en la misma sesión", () => {
    claimControlsHint();
    expect(claimControlsHint()).toBe(false);
    expect(claimControlsHint()).toBe(false);
  });

  it("es legible al entrar", () => {
    expect(hintOpacity(0)).toBe(1);
    expect(hintOpacity(CONTROLS_HINT_DURATION_MS - CONTROLS_HINT_FADE_MS)).toBe(1);
  });

  it("se desvanece progresivamente al final", () => {
    const middle = hintOpacity(CONTROLS_HINT_DURATION_MS - CONTROLS_HINT_FADE_MS / 2);

    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(1);
  });

  it("desaparece pasados los cinco segundos", () => {
    expect(CONTROLS_HINT_DURATION_MS).toBe(5000);
    expect(hintOpacity(CONTROLS_HINT_DURATION_MS)).toBe(0);
    expect(hintOpacity(CONTROLS_HINT_DURATION_MS + 1000)).toBe(0);
  });
});
