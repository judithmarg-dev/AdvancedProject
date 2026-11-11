import { CHAT } from "@office/shared";

const pad = (n: number) => String(n).padStart(2, "0");

/** Hora de un mensaje (ms epoch, fijada por el servidor) en la hora local de quien lee: HH:MM (spec 004 AC-2). */
export function formatTime(sentAt: number): string {
  const date = new Date(sentAt);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Texto de la burbuja: como mucho 60 caracteres, con «…» si se recorta (AC-7). Cuenta caracteres, no UTF-16. */
export function bubbleText(text: string): string {
  const chars = [...text];
  if (chars.length <= CHAT.bubbleChars) return text;
  return `${chars.slice(0, CHAT.bubbleChars - 1).join("").trimEnd()}…`;
}
