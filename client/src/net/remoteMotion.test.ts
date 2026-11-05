import { describe, expect, it } from "vitest";
import { MOVE_SPEED, SEND_RATE_HZ } from "@office/shared";
import { createSnapshotBuffer } from "./interpolation";
import { createRemoteMotion, updateRemoteMotion } from "./remoteMotion";
import { squashScale } from "../scene/animation";

const FRAME_MS = 1000 / 60;
const SEND_MS = 1000 / SEND_RATE_HZ;
const PATCH_MS = 50; // ritmo de parches por defecto de Colyseus
const LATENCY_MS = 30;

/**
 * Simula a A andando en línea recta durante `walkMs` y luego parado, visto desde B: A envía a 12 Hz, el
 * servidor difunde en parches cada 50 ms y B muestrea el búfer interpolado a 60 fps.
 */
function simulate(walkMs: number, totalMs: number) {
  const buffer = createSnapshotBuffer();
  const motion = createRemoteMotion({ x: 0, z: 0, rotY: 0 });
  const xAt = (t: number) => (Math.min(t, walkMs) / 1000) * MOVE_SPEED;
  const samples: { t: number; speed: number; squash: number }[] = [];

  let lastSent = 0;
  let lastSentAt = -Infinity;
  let nextPatch = 0;
  let previousFrame = 0;
  for (let t = 0; t <= totalMs; t += FRAME_MS) {
    if (t - lastSentAt >= SEND_MS - 1e-6 && xAt(t) !== lastSent) {
      lastSent = xAt(t);
      lastSentAt = t;
    }
    while (nextPatch <= t) {
      buffer.push(nextPatch + LATENCY_MS, { x: lastSent, z: 0, rotY: 0 });
      nextPatch += PATCH_MS;
    }
    const pose = buffer.sample(t);
    if (pose) updateRemoteMotion(motion, pose, (t - previousFrame) / 1000);
    previousFrame = t;
    samples.push({ t, speed: motion.speed, squash: squashScale(motion.acceleration).y });
  }
  return samples;
}

describe("movimiento remoto para las animaciones (AC-9)", () => {
  it("andando recto, la velocidad estimada se mantiene estable", () => {
    const steady = simulate(4000, 4000).filter((s) => s.t > 1000);
    const speeds = steady.map((s) => s.speed);

    expect(Math.min(...speeds)).toBeGreaterThan(MOVE_SPEED * 0.85);
    expect(Math.max(...speeds)).toBeLessThan(MOVE_SPEED * 1.15);
  });

  it("andando recto, el avatar apenas se deforma", () => {
    const steady = simulate(4000, 4000).filter((s) => s.t > 1000);
    const worst = Math.max(...steady.map((s) => Math.abs(s.squash - 1)));

    expect(worst).toBeLessThan(0.03);
  });

  it("al pararse vuelve a reposo", () => {
    const end = simulate(2000, 3500).filter((s) => s.t > 3000);

    for (const s of end) {
      expect(s.speed).toBeLessThan(0.05);
      expect(Math.abs(s.squash - 1)).toBeLessThan(0.01);
    }
  });
});
