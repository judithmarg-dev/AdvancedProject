import { useEffect, useState } from "react";
import {
  CONTROLS_HINT_DURATION_MS,
  CONTROLS_HINT_FADE_MS,
  CONTROLS_HINT_TEXT,
  claimControlsHint,
} from "./controlsHintState";

/** Aviso discreto con las teclas de movimiento; se desvanece y no vuelve en la sesión (AC-17). */
export function ControlsHint() {
  const [visible, setVisible] = useState(() => claimControlsHint());
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fade = setTimeout(() => setFading(true), CONTROLS_HINT_DURATION_MS - CONTROLS_HINT_FADE_MS);
    const hide = setTimeout(() => setVisible(false), CONTROLS_HINT_DURATION_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="controls-hint"
      style={{ opacity: fading ? 0 : 1, transitionDuration: `${CONTROLS_HINT_FADE_MS}ms` }}
    >
      {CONTROLS_HINT_TEXT}
    </div>
  );
}
