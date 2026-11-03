import { describe, expect, it } from "vitest";
import { INTERPOLATION_DELAY_MS } from "@office/shared";
import { createSnapshotBuffer } from "./interpolation";

const D = INTERPOLATION_DELAY_MS;
const pose = (x: number, z = 0, rotY = 0) => ({ x, z, rotY });

describe("búfer de instantáneas", () => {
  it("sin datos no devuelve nada", () => {
    expect(createSnapshotBuffer().sample(1000)).toBeNull();
  });

  it("con una sola instantánea se queda en ella", () => {
    const buffer = createSnapshotBuffer();
    buffer.push(1000, pose(2, 3, 1));
    expect(buffer.sample(1000)).toEqual(pose(2, 3, 1));
    expect(buffer.sample(5000)).toEqual(pose(2, 3, 1));
  });

  it("dibuja con el retraso de interpolación, entre las dos instantáneas que lo rodean (AC-9)", () => {
    const buffer = createSnapshotBuffer();
    buffer.push(1000, pose(0, 0));
    buffer.push(1100, pose(1, -2));

    expect(buffer.sample(1000 + D)).toEqual(pose(0, 0));
    const mid = buffer.sample(1050 + D)!;
    expect(mid.x).toBeCloseTo(0.5);
    expect(mid.z).toBeCloseTo(-1);
    expect(buffer.sample(1100 + D)).toEqual(pose(1, -2));
  });

  it("avanza sin saltos: muestras seguidas cambian poco (AC-9)", () => {
    const buffer = createSnapshotBuffer();
    for (let i = 0; i <= 12; i++) buffer.push(1000 + i * 83, pose(i * 0.25));

    let previous = buffer.sample(1000 + D)!.x;
    for (let t = 1000 + D + 16; t < 1000 + 12 * 83 + D; t += 16) {
      const x = buffer.sample(t)!.x;
      expect(x).toBeGreaterThanOrEqual(previous);
      expect(x - previous).toBeLessThan(0.06); // ~3 m/s × 16 ms
      previous = x;
    }
  });

  it("gira por el camino corto al cruzar ±π (AC-9)", () => {
    const buffer = createSnapshotBuffer();
    buffer.push(1000, pose(0, 0, Math.PI - 0.1));
    buffer.push(1100, pose(0, 0, -Math.PI + 0.1));

    const rot = buffer.sample(1050 + D)!.rotY;
    expect(Math.abs(Math.cos(rot) - -1)).toBeLessThan(1e-6); // pasa por π, no por 0
  });

  it("no extrapola: tras la última instantánea se queda quieto, sin derivar (AC-11)", () => {
    const buffer = createSnapshotBuffer();
    buffer.push(1000, pose(0));
    buffer.push(1100, pose(1));

    expect(buffer.sample(1100 + D + 500)).toEqual(pose(1));
    expect(buffer.sample(1100 + D + 5000)).toEqual(pose(1));
  });

  it("antes de la primera instantánea muestra la primera", () => {
    const buffer = createSnapshotBuffer();
    buffer.push(1000, pose(4));
    buffer.push(1100, pose(5));
    expect(buffer.sample(900)).toEqual(pose(4));
  });

  it("una instantánea con la misma hora sustituye a la anterior", () => {
    const buffer = createSnapshotBuffer();
    buffer.push(1000, pose(0));
    buffer.push(1000, pose(1));
    expect(buffer.sample(1000 + D)).toEqual(pose(1));
  });

  it("descarta instantáneas viejas: el búfer no crece sin límite", () => {
    const buffer = createSnapshotBuffer();
    for (let i = 0; i < 1000; i++) {
      buffer.push(i * 83, pose(i));
      buffer.sample(i * 83);
    }
    expect(buffer.size()).toBeLessThan(10);
  });
});
