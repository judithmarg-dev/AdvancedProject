import { describe, expect, it } from "vitest";
import { CHAT } from "@office/shared";
import { bubbleText, formatTime } from "./chatFormat";

describe("formatTime (AC-2)", () => {
  it("muestra HH:MM en la hora local, con ceros a la izquierda", () => {
    const at = new Date(2026, 10, 5, 9, 5, 42).getTime();
    expect(formatTime(at)).toBe("09:05");
  });

  it("usa formato de 24 horas", () => {
    expect(formatTime(new Date(2026, 10, 5, 23, 59).getTime())).toBe("23:59");
    expect(formatTime(new Date(2026, 10, 5, 0, 0).getTime())).toBe("00:00");
  });
});

describe("bubbleText (AC-7)", () => {
  it(`deja igual un texto de hasta ${CHAT.bubbleChars} caracteres`, () => {
    expect(CHAT.bubbleChars).toBe(60);
    expect(bubbleText("hola")).toBe("hola");
    expect(bubbleText("a".repeat(60))).toBe("a".repeat(60));
  });

  it("recorta los más largos a 60 caracteres en total, con «…» al final", () => {
    const result = bubbleText("a".repeat(61));
    expect([...result]).toHaveLength(60);
    expect(result.endsWith("…")).toBe(true);
  });

  it("no parte caracteres compuestos por dos unidades UTF-16", () => {
    const result = bubbleText("🙂".repeat(80));
    expect(result).toBe(`${"🙂".repeat(59)}…`);
  });

  it("no deja un espacio antes de los puntos suspensivos", () => {
    const text = `${"a".repeat(58)} bbbbbb`;
    expect(bubbleText(text)).toBe(`${"a".repeat(58)}…`);
  });
});
