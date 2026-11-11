import { describe, expect, it } from "vitest";
import { CHAT, allowChat, normalizeChatText, parseChatSend } from "./chat";

describe("normalizeChatText", () => {
  it("rechaza el mensaje vacío o formado solo por espacios (AC-4)", () => {
    expect(normalizeChatText("")).toBeNull();
    expect(normalizeChatText("   ")).toBeNull();
    expect(normalizeChatText("\n\t ")).toBeNull();
  });

  it("descarta los espacios del principio y del final (AC-5)", () => {
    expect(normalizeChatText("  hola a todos  ")).toBe("hola a todos");
  });

  it("admite hasta 200 caracteres y rechaza más (AC-5, AC-12)", () => {
    expect(CHAT.maxLength).toBe(200);
    expect(normalizeChatText("a".repeat(200))).toBe("a".repeat(200));
    expect(normalizeChatText("a".repeat(201))).toBeNull();
    expect(normalizeChatText(`  ${"a".repeat(200)}  `)).toBe("a".repeat(200));
  });

  it("cuenta caracteres, no unidades UTF-16 (AC-5)", () => {
    expect(normalizeChatText("🙂".repeat(200))).toBe("🙂".repeat(200));
  });

  it("rechaza valores que no son texto (AC-12)", () => {
    expect(normalizeChatText(undefined)).toBeNull();
    expect(normalizeChatText(42)).toBeNull();
    expect(normalizeChatText({ text: "hola" })).toBeNull();
  });
});

describe("parseChatSend", () => {
  it("acepta un objeto con texto válido y lo devuelve recortado", () => {
    expect(parseChatSend({ text: " hola " })).toEqual({ text: "hola" });
  });

  it("ignora campos de más, como un autor falso (AC-11)", () => {
    expect(parseChatSend({ text: "hola", authorName: "Otro" })).toEqual({ text: "hola" });
  });

  it("rechaza mensajes mal formados (AC-12)", () => {
    expect(parseChatSend("hola")).toBeNull();
    expect(parseChatSend(null)).toBeNull();
    expect(parseChatSend(undefined)).toBeNull();
    expect(parseChatSend([])).toBeNull();
    expect(parseChatSend({})).toBeNull();
    expect(parseChatSend({ text: 5 })).toBeNull();
    expect(parseChatSend({ text: "  " })).toBeNull();
  });
});

describe("allowChat", () => {
  it("permite hasta 5 mensajes en 5 s (AC-13)", () => {
    expect(CHAT.rateCount).toBe(5);
    expect(CHAT.rateWindowMs).toBe(5000);
    expect(allowChat([], 0)).toBe(true);
    expect(allowChat([0, 100, 200, 300], 400)).toBe(true);
  });

  it("rechaza el 6.º dentro de la ventana (AC-13)", () => {
    expect(allowChat([0, 100, 200, 300, 400], 500)).toBe(false);
    expect(allowChat([0, 100, 200, 300, 400], 4999)).toBe(false);
  });

  it("la ventana se desliza: al salir el más antiguo vuelve a permitir (AC-13)", () => {
    expect(allowChat([0, 100, 200, 300, 400], 5000)).toBe(true);
    expect(allowChat([0, 100, 200, 300, 400], 5150)).toBe(true);
  });
});
