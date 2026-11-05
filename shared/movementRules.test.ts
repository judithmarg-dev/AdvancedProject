import { describe, expect, it } from "vitest";
import { MAX_MOVE_GAP_MS, MOVE_TOLERANCE, parseMoveMessage, validateMove } from "./movementRules";
import { AVATAR, FURNITURE, MOVE_SPEED, ROOM_SIZE, SPAWN } from "./world";

const halfW = ROOM_SIZE.width / 2;
const halfD = ROOM_SIZE.depth / 2;
/** Intervalo normal entre dos envíos a 12 Hz. */
const TICK_MS = 1000 / 12;

describe("parseMoveMessage", () => {
  it("acepta un objeto con tres números finitos", () => {
    expect(parseMoveMessage({ x: 1, z: -2, rotY: 0.5 })).toEqual({ x: 1, z: -2, rotY: 0.5 });
  });

  it("ignora campos de más", () => {
    expect(parseMoveMessage({ x: 1, z: 2, rotY: 3, color: "#fff" })).toEqual({ x: 1, z: 2, rotY: 3 });
  });

  it("rechaza mensajes con campos que faltan (AC-14)", () => {
    expect(parseMoveMessage({ x: 1, z: 2 })).toBeNull();
    expect(parseMoveMessage({ z: 2, rotY: 0 })).toBeNull();
    expect(parseMoveMessage({})).toBeNull();
  });

  it("rechaza tipos incorrectos (AC-14)", () => {
    expect(parseMoveMessage({ x: "1", z: 2, rotY: 0 })).toBeNull();
    expect(parseMoveMessage({ x: 1, z: null, rotY: 0 })).toBeNull();
    expect(parseMoveMessage([1, 2, 3])).toBeNull();
    expect(parseMoveMessage("mover")).toBeNull();
    expect(parseMoveMessage(null)).toBeNull();
    expect(parseMoveMessage(undefined)).toBeNull();
  });

  it("rechaza valores no numéricos o infinitos (AC-14)", () => {
    expect(parseMoveMessage({ x: Number.NaN, z: 0, rotY: 0 })).toBeNull();
    expect(parseMoveMessage({ x: 0, z: Number.POSITIVE_INFINITY, rotY: 0 })).toBeNull();
    expect(parseMoveMessage({ x: 0, z: 0, rotY: Number.NEGATIVE_INFINITY })).toBeNull();
  });
});

describe("validateMove", () => {
  /** Lo que avanza el avatar a velocidad máxima en `ms`. */
  const stepFor = (ms: number) => (MOVE_SPEED * ms) / 1000;

  it("acepta un paso normal a velocidad máxima", () => {
    const next = { x: SPAWN.x + stepFor(TICK_MS), z: SPAWN.z };
    expect(validateMove(SPAWN, next, TICK_MS)).toBe(true);
  });

  it("acepta quedarse en el sitio", () => {
    expect(validateMove(SPAWN, SPAWN, TICK_MS)).toBe(true);
  });

  it("acepta mensajes que llegan juntos por la red (margen fijo)", () => {
    const next = { x: SPAWN.x + stepFor(TICK_MS), z: SPAWN.z };
    expect(validateMove(SPAWN, next, 0)).toBe(true);
  });

  it("rechaza desplazamientos más rápidos que la velocidad máxima con tolerancia (AC-13)", () => {
    const limit = stepFor(TICK_MS) * MOVE_TOLERANCE.factor + MOVE_TOLERANCE.slack;
    expect(validateMove(SPAWN, { x: SPAWN.x + limit + 0.05, z: SPAWN.z }, TICK_MS)).toBe(false);
    expect(validateMove(SPAWN, { x: SPAWN.x + limit - 0.05, z: SPAWN.z }, TICK_MS)).toBe(true);
  });

  it("no concede más tiempo que el tope tras estar mucho rato sin enviar (AC-13)", () => {
    const capped = stepFor(MAX_MOVE_GAP_MS) * MOVE_TOLERANCE.factor + MOVE_TOLERANCE.slack;
    const far = { x: SPAWN.x - (capped + 0.1), z: SPAWN.z };
    expect(validateMove(SPAWN, far, 60_000)).toBe(false);
  });

  it("rechaza posiciones fuera de la sala (AC-13)", () => {
    expect(validateMove(SPAWN, { x: halfW + 1, z: 0 }, 60_000)).toBe(false);
    expect(validateMove({ x: 0, z: halfD - 0.5 }, { x: 0, z: halfD + 0.2 }, 1000)).toBe(false);
  });

  it("rechaza atravesar una pared aunque el destino quede cerca (AC-13)", () => {
    const insideWest = { x: -halfW + AVATAR.radius + 0.01, z: 0 };
    expect(validateMove(insideWest, { x: insideWest.x - 0.5, z: 0 }, 1000)).toBe(false);
  });

  it("rechaza meterse dentro de un mueble (AC-13)", () => {
    const desk = FURNITURE[0]!;
    const beside = { x: desk.minX - AVATAR.radius - 0.05, z: (desk.minZ + desk.maxZ) / 2 };
    const inside = { x: desk.minX + 0.3, z: beside.z };
    expect(validateMove(beside, inside, 1000)).toBe(false);
  });

  it("rechaza cruzar un mueble de lado a lado (AC-13)", () => {
    const plant = FURNITURE[4]!;
    const z = (plant.minZ + plant.maxZ) / 2;
    const west = { x: plant.minX - AVATAR.radius - 0.05, z };
    const east = { x: plant.maxX + AVATAR.radius + 0.05, z };
    expect(validateMove(west, east, MAX_MOVE_GAP_MS)).toBe(false);
  });

  it("acepta deslizarse pegado a una pared", () => {
    const contact = -halfW + AVATAR.radius + 1e-4;
    expect(validateMove({ x: contact, z: 0 }, { x: contact, z: stepFor(TICK_MS) }, TICK_MS)).toBe(true);
  });

  it("acepta rodear la esquina de un mueble en un solo envío", () => {
    const desk = FURNITURE[0]!;
    const r = AVATAR.radius + 1e-4;
    // De la cara sur a la cara este del escritorio, pasando por la esquina en ~0,25 m.
    const onSouth = { x: desk.maxX + r - 0.12, z: desk.maxZ + r };
    const onEast = { x: desk.maxX + r, z: desk.maxZ + r - 0.12 };
    expect(validateMove(onSouth, onEast, TICK_MS)).toBe(true);
  });
});
