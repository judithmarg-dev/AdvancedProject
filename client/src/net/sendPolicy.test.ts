import { describe, expect, it } from "vitest";
import { SEND_RATE_HZ } from "@office/shared";
import { createSendPolicy } from "./sendPolicy";

const FRAME = 1000 / 60;
const pose = (x: number, z = 0, rotY = 0) => ({ x, z, rotY });

/** Simula `seconds` de fotogramas a 60 fps y devuelve los instantes en que se envió. */
function run(policy: ReturnType<typeof createSendPolicy>, seconds: number, at: (t: number) => ReturnType<typeof pose>, start = 0) {
  const sent: number[] = [];
  for (let t = start; t < start + seconds * 1000; t += FRAME) {
    if (policy.update(t, at(t))) sent.push(t);
  }
  return sent;
}

describe("ritmo de envío de la posición propia", () => {
  it("envía entre 10 y 15 veces por segundo mientras se mueve (AC-10)", () => {
    expect(SEND_RATE_HZ).toBeGreaterThanOrEqual(10);
    expect(SEND_RATE_HZ).toBeLessThanOrEqual(15);

    const policy = createSendPolicy(pose(0));
    const sent = run(policy, 2, (t) => pose((t / 1000) * 3));

    expect(sent.length / 2).toBeGreaterThanOrEqual(10);
    expect(sent.length / 2).toBeLessThanOrEqual(15);
    for (let i = 1; i < sent.length; i++) expect(sent[i]! - sent[i - 1]!).toBeGreaterThanOrEqual(1000 / 15);
  });

  it("no envía nada mientras está quieto (AC-10)", () => {
    const policy = createSendPolicy(pose(0));
    expect(run(policy, 3, () => pose(0))).toEqual([]);
  });

  it("al pararse envía la posición final exacta y después nada (AC-10)", () => {
    const policy = createSendPolicy(pose(0));
    const sentPoses: number[] = [];
    let x = 0;
    for (let t = 0; t < 3000; t += FRAME) {
      if (t < 1000) x = (t / 1000) * 3; // se mueve 1 s y se detiene en x ≈ 3
      const out = policy.update(t, pose(x));
      if (out) sentPoses.push(out.x);
    }
    expect(sentPoses[sentPoses.length - 1]).toBe(x);
    const afterStop = run(policy, 1, () => pose(x), 3000);
    expect(afterStop).toEqual([]);
  });

  it("un giro sin desplazamiento también se envía", () => {
    const policy = createSendPolicy(pose(0));
    const out = policy.update(200, pose(0, 0, 1.2));
    expect(out).toEqual(pose(0, 0, 1.2));
  });

  it("tras una corrección parte de la posición corregida (AC-13)", () => {
    const policy = createSendPolicy(pose(0));
    policy.update(200, pose(1));
    policy.reset(pose(-2, 4.5));
    expect(policy.update(400, pose(-2, 4.5))).toBeNull();
  });
});
