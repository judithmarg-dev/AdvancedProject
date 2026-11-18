import { describe, expect, it } from "vitest";
import { avShortcut } from "./avKeys";

const field = { tagName: "INPUT" };
const page = { tagName: "BODY" };

describe("atajos de micrófono y cámara (spec 005 AC-8)", () => {
  it("M conmuta el micrófono y V la cámara fuera del chat, en mayúscula o minúscula", () => {
    expect(avShortcut({ key: "m", target: page })).toBe("mic");
    expect(avShortcut({ key: "M", target: page })).toBe("mic");
    expect(avShortcut({ key: "v", target: page })).toBe("cam");
    expect(avShortcut({ key: "V", target: page })).toBe("cam");
  });

  it("con el foco en el campo del chat no conmutan nada", () => {
    expect(avShortcut({ key: "m", target: field })).toBeNull();
    expect(avShortcut({ key: "v", target: { tagName: "TEXTAREA" } })).toBeNull();
  });

  it("ignora otras teclas, repeticiones y combinaciones con modificadores", () => {
    expect(avShortcut({ key: "w", target: page })).toBeNull();
    expect(avShortcut({ key: "m", target: page, repeat: true })).toBeNull();
    expect(avShortcut({ key: "v", target: page, ctrlKey: true })).toBeNull();
    expect(avShortcut({ key: "m", target: page, metaKey: true })).toBeNull();
    expect(avShortcut({ key: "m", target: page, altKey: true })).toBeNull();
  });
});
