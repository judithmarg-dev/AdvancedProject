import { describe, expect, it } from "vitest";
import { AVATAR_COLORS, MAX_PLAYERS, NAME_MAX_LENGTH, normalizeName, pickColor } from "./players";

describe("normalizeName", () => {
  it("rechaza el nombre vacío o formado solo por espacios (AC-2)", () => {
    expect(normalizeName("")).toBeNull();
    expect(normalizeName("   ")).toBeNull();
    expect(normalizeName("\t\n ")).toBeNull();
  });

  it("descarta los espacios del principio y del final (AC-3)", () => {
    expect(normalizeName("  Ana  ")).toBe("Ana");
    expect(normalizeName(" Ana María ")).toBe("Ana María");
  });

  it("admite hasta 20 caracteres y rechaza más (AC-3)", () => {
    expect(NAME_MAX_LENGTH).toBe(20);
    expect(normalizeName("a".repeat(20))).toBe("a".repeat(20));
    expect(normalizeName("a".repeat(21))).toBeNull();
    expect(normalizeName(`  ${"a".repeat(20)}  `)).toBe("a".repeat(20));
  });

  it("cuenta caracteres, no unidades UTF-16 (AC-3)", () => {
    expect(normalizeName("ñ".repeat(20))).toBe("ñ".repeat(20));
    expect(normalizeName("🙂".repeat(20))).toBe("🙂".repeat(20));
  });

  it("rechaza valores que no son texto", () => {
    expect(normalizeName(undefined)).toBeNull();
    expect(normalizeName(null)).toBeNull();
    expect(normalizeName(42)).toBeNull();
    expect(normalizeName({ name: "Ana" })).toBeNull();
  });
});

describe("colores de avatar", () => {
  it("hay al menos un color distinto por plaza de la sala (AC-6)", () => {
    expect(MAX_PLAYERS).toBe(20);
    expect(AVATAR_COLORS.length).toBeGreaterThanOrEqual(MAX_PLAYERS);
    expect(new Set(AVATAR_COLORS.map((c) => c.toLowerCase())).size).toBe(AVATAR_COLORS.length);
  });

  it("son colores hexadecimales", () => {
    for (const color of AVATAR_COLORS) expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("elige el primer color libre (AC-6)", () => {
    expect(pickColor([])).toBe(AVATAR_COLORS[0]);
    expect(pickColor([AVATAR_COLORS[0]!])).toBe(AVATAR_COLORS[1]);
    expect(pickColor([AVATAR_COLORS[1]!])).toBe(AVATAR_COLORS[0]);
  });

  it("no repite mientras haya colores libres y reutiliza los liberados (AC-6)", () => {
    const used: string[] = [];
    for (let i = 0; i < MAX_PLAYERS; i++) used.push(pickColor(used));
    expect(new Set(used).size).toBe(MAX_PLAYERS);

    const freed = used.splice(5, 1)[0];
    expect(pickColor(used)).toBe(freed);
  });
});
