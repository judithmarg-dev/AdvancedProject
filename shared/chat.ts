/**
 * Reglas del chat de sala (spec 004). Las aplica el servidor como autoridad; el cliente solo repite el
 * límite de longitud como cortesía en el campo de escritura.
 */
import type { ChatSend } from "./types";

export const CHAT = {
  /** Longitud máxima del mensaje tras recortar espacios (caracteres). */
  maxLength: 200,
  /** Caracteres que muestra la burbuja sobre el avatar antes de recortar con «…». */
  bubbleChars: 60,
  /** Vida de la burbuja (ms). */
  bubbleMs: 5000,
  /** Ritmo máximo: `rateCount` mensajes cada `rateWindowMs` por participante. */
  rateCount: 5,
  rateWindowMs: 5000,
  /** Mensajes que conserva el servidor para quien entra. */
  historySize: 20,
  /** Entradas (mensajes y avisos) que conserva el panel de cada participante. */
  panelSize: 100,
} as const;

/** Texto recortado si es válido (1–200 caracteres), o `null`. Cuenta caracteres, no unidades UTF-16. */
export function normalizeChatText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  const length = [...text].length;
  return length >= 1 && length <= CHAT.maxLength ? text : null;
}

/** Envío de chat si es un objeto con `text` válido (ya recortado); si no, `null`. Ignora campos de más. */
export function parseChatSend(raw: unknown): ChatSend | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const text = normalizeChatText((raw as Record<string, unknown>).text);
  return text === null ? null : { text };
}

/** ¿Cabe otro mensaje ahora? `recent` son las horas (ms) de los envíos aceptados del participante. */
export function allowChat(recent: readonly number[], now: number): boolean {
  const inWindow = recent.filter((time) => now - time < CHAT.rateWindowMs).length;
  return inWindow < CHAT.rateCount;
}
