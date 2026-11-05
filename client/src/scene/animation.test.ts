import { describe, expect, it } from "vitest";
import { MOVE_SPEED } from "@office/shared";
import { advanceWalkPhase, BREATHING_PERIOD, breathingOffset, squashScale, walkBob } from "./animation";

describe("respiración en reposo (AC-11)", () => {
  it("es periódica", () => {
    expect(breathingOffset(0.7)).toBeCloseTo(breathingOffset(0.7 + BREATHING_PERIOD), 6);
  });

  it("sube y baja alrededor de la posición de reposo", () => {
    const samples = Array.from({ length: 64 }, (_, i) => breathingOffset((i * BREATHING_PERIOD) / 64));

    expect(Math.max(...samples)).toBeGreaterThan(0.01);
    expect(Math.min(...samples)).toBeLessThan(-0.01);
  });

  it("es un movimiento sutil, no un salto", () => {
    const samples = Array.from({ length: 64 }, (_, i) => breathingOffset((i * BREATHING_PERIOD) / 64));

    expect(Math.max(...samples.map(Math.abs))).toBeLessThan(0.06);
  });
});

describe("balanceo al caminar (AC-12)", () => {
  it("no balancea si el avatar está quieto", () => {
    expect(walkBob(0.4, 0)).toBe(0);
  });

  it("balancea más cuanto más rápido se mueve", () => {
    const slow = Array.from({ length: 32 }, (_, i) => Math.abs(walkBob(i / 8, MOVE_SPEED / 3)));
    const fast = Array.from({ length: 32 }, (_, i) => Math.abs(walkBob(i / 8, MOVE_SPEED)));

    expect(Math.max(...fast)).toBeGreaterThan(Math.max(...slow));
  });
});

describe("fase del paso (spec 003 AC-9)", () => {
  it("no avanza con el avatar quieto", () => {
    expect(advanceWalkPhase(1.3, 0.016, 0)).toBe(1.3);
  });

  it("avanza más rápido cuanto más rápido anda", () => {
    expect(advanceWalkPhase(0, 0.016, MOVE_SPEED)).toBeGreaterThan(advanceWalkPhase(0, 0.016, MOVE_SPEED / 2));
  });

  it("un cambio pequeño de velocidad no hace saltar el balanceo, aunque lleve mucho tiempo andando", () => {
    // un minuto andando a velocidad máxima
    let phase = 0;
    for (let i = 0; i < 3600; i++) phase = advanceWalkPhase(phase, 1 / 60, MOVE_SPEED);

    const before = walkBob(phase, MOVE_SPEED);
    const nextPhase = advanceWalkPhase(phase, 1 / 60, MOVE_SPEED * 0.9);
    const after = walkBob(nextPhase, MOVE_SPEED * 0.9);

    expect(Math.abs(after - before)).toBeLessThan(0.01);
  });
});

describe("squash and stretch (AC-12)", () => {
  it("no deforma al avatar sin cambios de velocidad", () => {
    expect(squashScale(0)).toEqual({ x: 1, y: 1, z: 1 });
  });

  it("estira al arrancar", () => {
    const scale = squashScale(20);

    expect(scale.y).toBeGreaterThan(1);
    expect(scale.x).toBeLessThan(1);
  });

  it("aplasta al frenar", () => {
    const scale = squashScale(-20);

    expect(scale.y).toBeLessThan(1);
    expect(scale.x).toBeGreaterThan(1);
  });

  it("conserva el volumen aparente", () => {
    const scale = squashScale(15);

    expect(scale.x * scale.y * scale.z).toBeCloseTo(1, 6);
  });

  it("limita la deformación por grande que sea el cambio de velocidad", () => {
    expect(squashScale(1000).y).toBeCloseTo(squashScale(100).y, 6);
    expect(squashScale(1000).y).toBeLessThan(1.25);
  });

  it("vuelve a la forma de reposo cuando cesa el cambio de velocidad", () => {
    expect(squashScale(0).y).toBe(1);
  });
});
