import { isEditableTarget } from "../scene/input";

export type AvKeyEvent = {
  key: string;
  target: unknown;
  repeat?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

/** Qué conmuta una tecla: M el micrófono, V la cámara; nada si se está escribiendo en el chat (spec 005 AC-8). */
export function avShortcut(event: AvKeyEvent): "mic" | "cam" | null {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return null;
  const key = event.key.toLowerCase();
  if (key === "m") return "mic";
  if (key === "v") return "cam";
  return null;
}
