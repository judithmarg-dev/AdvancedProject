import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, root), "utf8");

describe("variables de entorno", () => {
  it(".env.example documenta todas las variables del proyecto", () => {
    const keys = read(".env.example")
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.startsWith("#"))
      .map((line) => line.split("=")[0]);
    expect(keys).toEqual(expect.arrayContaining(["PORT", "VITE_SERVER_URL"]));
  });

  it(".env no se versiona", () => {
    const ignored = read(".gitignore").split("\n").map((line) => line.trim());
    expect(ignored).toContain(".env");
  });
});
