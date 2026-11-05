import { describe, expect, it } from "vitest";
import {
  AVATAR_GAP,
  AVATAR_OVERLAP_TOLERANCE,
  findSpawn,
  moveAvatar,
  overlapsAvatar,
  separateFromAvatars,
} from "./avatarCollision";
import { AVATAR, OBSTACLES, ROOM_SIZE, SPAWN, collides, type Vec2 } from "./world";

const r = AVATAR.radius;
const gap = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);

describe("separateFromAvatars", () => {
  const other = { x: 0, z: 0 };

  it("deja pasar el movimiento si no hay nadie cerca", () => {
    expect(separateFromAvatars({ x: 3, z: 0 }, { x: 2.9, z: 0 }, [other])).toEqual({ x: 2.9, z: 0 });
  });

  it("se detiene al contacto al caminar de frente hacia otro avatar (AC-22)", () => {
    const result = separateFromAvatars({ x: 1, z: 0 }, { x: 0.5, z: 0 }, [other]);
    expect(gap(result, other)).toBeCloseTo(AVATAR_GAP, 6);
  });

  it("no atraviesa a otro avatar ni con un paso largo (AC-22)", () => {
    const result = separateFromAvatars({ x: 0.8, z: 0 }, { x: -0.8, z: 0 }, [other]);
    expect(result.x).toBeGreaterThan(0);
    expect(gap(result, other)).toBeGreaterThanOrEqual(AVATAR_GAP - 1e-9);
  });

  it("se desliza alrededor al rozarlo en diagonal (AC-22)", () => {
    const from = { x: 0.7, z: 0.3 };
    const result = separateFromAvatars(from, { x: 0.5, z: 0.5 }, [other]);
    expect(gap(result, other)).toBeGreaterThanOrEqual(AVATAR_GAP - 1e-9);
    expect(result.z).toBeGreaterThan(from.z);
  });

  it("si ya se solapan, puede alejarse (AC-23)", () => {
    expect(separateFromAvatars({ x: 0.2, z: 0 }, { x: 0.3, z: 0 }, [other])).toEqual({ x: 0.3, z: 0 });
  });

  it("si ya se solapan, no se acerca más (AC-23)", () => {
    const from = { x: 0.3, z: 0 };
    const result = separateFromAvatars(from, { x: 0.2, z: 0 }, [other]);
    expect(gap(result, other)).toBeGreaterThanOrEqual(gap(from, other) - 1e-9);
  });

  it("en la misma posición exacta puede moverse en cualquier dirección (AC-23)", () => {
    expect(separateFromAvatars({ x: 0, z: 0 }, { x: 0.05, z: 0 }, [other])).toEqual({ x: 0.05, z: 0 });
  });

  it("entre dos avatares no se mete en ninguno (AC-22)", () => {
    const others = [{ x: -AVATAR_GAP / 2 - 0.3, z: 0 }, { x: AVATAR_GAP / 2 + 0.3, z: 0 }];
    const result = separateFromAvatars({ x: 0, z: 1 }, { x: 0, z: 0 }, others);
    for (const o of others) expect(gap(result, o)).toBeGreaterThanOrEqual(AVATAR_GAP - 1e-9);
  });
});

describe("moveAvatar", () => {
  it("aplica las colisiones con paredes y muebles como resolveMovement", () => {
    const halfW = ROOM_SIZE.width / 2;
    const result = moveAvatar({ x: halfW - r - 0.01, z: 0 }, { x: 1, z: 0 }, []);
    expect(result.x).toBeLessThanOrEqual(halfW - r);
  });

  it("no queda dentro de un mueble al rodear a otro avatar", () => {
    // Avatar pegado al escritorio por el oeste; otro le empuja hacia él al rozarlo.
    const from = { x: 0.2 - r - 0.01, z: 2 };
    const other = { x: from.x - AVATAR_GAP + 0.05, z: 2.3 };
    const result = moveAvatar(from, { x: -0.1, z: 0 }, [other]);
    expect(collides(result, r, OBSTACLES)).toBe(false);
    expect(gap(result, other)).toBeGreaterThanOrEqual(Math.min(AVATAR_GAP, gap(from, other)) - 1e-9);
  });
});

describe("findSpawn", () => {
  it("usa el punto de entrada si está libre (AC-24)", () => {
    expect(findSpawn([])).toEqual(SPAWN);
    expect(findSpawn([{ x: SPAWN.x + 3, z: SPAWN.z }])).toEqual(SPAWN);
  });

  it("si está ocupado, elige un hueco libre cercano sin muebles ni avatares (AC-24)", () => {
    const occupied: Vec2[] = [{ ...SPAWN }];
    for (let i = 0; i < 19; i++) {
      const spot = findSpawn(occupied);
      expect(collides(spot, r, OBSTACLES)).toBe(false);
      for (const o of occupied) expect(gap(spot, o)).toBeGreaterThanOrEqual(AVATAR_GAP);
      occupied.push(spot);
    }
  });

  it("el hueco elegido es el más cercano al punto de entrada (AC-24)", () => {
    const spot = findSpawn([{ ...SPAWN }]);
    expect(gap(spot, SPAWN)).toBeLessThan(AVATAR_GAP + 0.3);
  });
});

describe("overlapsAvatar", () => {
  const other = { x: 0, z: 0 };

  it("tolera solapes pequeños por el retraso de red (AC-25)", () => {
    const near = { x: AVATAR_OVERLAP_TOLERANCE + 0.05, z: 0 };
    expect(overlapsAvatar({ x: 1, z: 0 }, near, [other])).toBe(false);
  });

  it("detecta un solape claro que acerca a los avatares (AC-25)", () => {
    expect(overlapsAvatar({ x: 0.6, z: 0 }, { x: 0.1, z: 0 }, [other])).toBe(true);
    expect(overlapsAvatar({ x: 0.6, z: 0 }, { x: -0.1, z: 0 }, [other])).toBe(true);
  });

  it("no rechaza alejarse aunque sigan solapados (AC-23)", () => {
    expect(overlapsAvatar({ x: 0.05, z: 0 }, { x: 0.15, z: 0 }, [other])).toBe(false);
  });

  it("detecta atravesar a otro avatar aunque el destino quede fuera (AC-25)", () => {
    expect(overlapsAvatar({ x: 0.75, z: 0 }, { x: -0.75, z: 0 }, [other])).toBe(true);
  });
});
