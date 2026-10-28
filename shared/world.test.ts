import { describe, expect, it } from "vitest";
import {
  AVATAR,
  FURNITURE,
  OBSTACLES,
  ROOM_SIZE,
  SPAWN,
  collides,
  resolveMovement,
} from "./world";

const r = AVATAR.radius;
const halfW = ROOM_SIZE.width / 2;
const halfD = ROOM_SIZE.depth / 2;

describe("medidas de la sala", () => {
  it("es una sala de 16 × 12 metros", () => {
    expect(ROOM_SIZE).toEqual({ width: 16, depth: 12 });
  });

  it("coloca el punto de entrada dentro de la sala y libre de obstáculos", () => {
    expect(Math.abs(SPAWN.x)).toBeLessThan(halfW - r);
    expect(Math.abs(SPAWN.z)).toBeLessThan(halfD - r);
    expect(collides(SPAWN, r, OBSTACLES)).toBe(false);
  });
});

describe("resolveMovement contra las paredes (AC-8)", () => {
  it("detiene al avatar en contacto con la pared este", () => {
    const next = resolveMovement({ x: 7, z: 0 }, { x: 5, z: 0 }, r, OBSTACLES);
    expect(next.x).toBeCloseTo(halfW - r, 3);
    expect(collides(next, r, OBSTACLES)).toBe(false);
  });

  it("detiene al avatar en contacto con la pared oeste", () => {
    const next = resolveMovement({ x: -7, z: 0 }, { x: -5, z: 0 }, r, OBSTACLES);
    expect(next.x).toBeCloseTo(-halfW + r, 3);
  });

  it("detiene al avatar en contacto con la pared norte", () => {
    const next = resolveMovement({ x: 0, z: -5 }, { x: 0, z: -5 }, r, OBSTACLES);
    expect(next.z).toBeCloseTo(-halfD + r, 3);
  });

  it("detiene al avatar en contacto con la pared sur", () => {
    const next = resolveMovement({ x: 0, z: 5 }, { x: 0, z: 5 }, r, OBSTACLES);
    expect(next.z).toBeCloseTo(halfD - r, 3);
  });

  it("deja avanzar libremente lejos de cualquier obstáculo", () => {
    const next = resolveMovement({ x: 0, z: 0 }, { x: 0.05, z: 0.05 }, r, OBSTACLES);
    expect(next.x).toBeCloseTo(0.05, 6);
    expect(next.z).toBeCloseTo(0.05, 6);
  });
});

describe("deslizamiento en diagonal (AC-9)", () => {
  it("conserva el componente paralelo a la pared", () => {
    const start = { x: halfW - r, z: 0 };
    const next = resolveMovement(start, { x: 0.05, z: 0.05 }, r, OBSTACLES);
    expect(next.x).toBeCloseTo(start.x, 3); // bloqueado contra la pared
    expect(next.z).toBeCloseTo(0.05, 3); // sigue avanzando en paralelo
  });

  it("permite salir de una esquina deslizando por la pared", () => {
    const start = { x: -halfW + r, z: -halfD + r };
    const next = resolveMovement(start, { x: -0.05, z: 0.05 }, r, OBSTACLES);
    expect(next.x).toBeCloseTo(start.x, 3);
    expect(next.z).toBeCloseTo(start.z + 0.05, 3);
  });
});

describe("mobiliario (AC-10)", () => {
  it("define al menos escritorio, silla, mueble bajo y una planta", () => {
    expect(FURNITURE.length).toBeGreaterThanOrEqual(4);
  });

  it("detiene el avance contra cada pieza de mobiliario", () => {
    for (const box of FURNITURE) {
      const centerZ = (box.minZ + box.maxZ) / 2;
      const start = { x: box.minX - r - 0.5, z: centerZ };
      expect(collides(start, r, OBSTACLES)).toBe(false); // el punto de partida es libre
      const next = resolveMovement(start, { x: 1, z: 0 }, r, OBSTACLES);
      expect(next.x).toBeCloseTo(box.minX - r, 3);
      expect(collides(next, r, OBSTACLES)).toBe(false);
    }
  });

  it("ninguna pieza de mobiliario se sale de la sala", () => {
    for (const box of FURNITURE) {
      expect(box.minX).toBeGreaterThanOrEqual(-halfW);
      expect(box.maxX).toBeLessThanOrEqual(halfW);
      expect(box.minZ).toBeGreaterThanOrEqual(-halfD);
      expect(box.maxZ).toBeLessThanOrEqual(halfD);
    }
  });
});
