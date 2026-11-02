import { describe, expect, it } from "vitest";
import { MOVE_SPEED } from "@office/shared";
import { angleFromDirection, shortestAngleDelta, stepVelocity, turnToward } from "./movement";

const DT = 1 / 60;

/** Simula `seconds` de bucle de fotogramas con la misma intención de movimiento. */
function simulate(velocity: { x: number; z: number }, desired: { x: number; z: number }, seconds: number) {
  let current = velocity;
  for (let t = 0; t < seconds; t += DT) current = stepVelocity(current, desired, DT);
  return current;
}

describe("stepVelocity (AC-3, AC-4)", () => {
  it("acelera hasta la velocidad máxima y no la supera", () => {
    const desired = { x: 0, z: -MOVE_SPEED };
    const after = simulate({ x: 0, z: 0 }, desired, 0.5);

    expect(Math.hypot(after.x, after.z)).toBeCloseTo(MOVE_SPEED, 5);
    expect(after.z).toBeCloseTo(-MOVE_SPEED, 5);
  });

  it("alcanza la velocidad máxima en menos de 0,2 s", () => {
    const desired = { x: 0, z: -MOVE_SPEED };
    const after = simulate({ x: 0, z: 0 }, desired, 0.2);

    expect(Math.hypot(after.x, after.z)).toBeCloseTo(MOVE_SPEED, 3);
  });

  it("se detiene por completo en menos de 0,2 s al soltar las teclas (AC-4)", () => {
    const after = simulate({ x: 0, z: -MOVE_SPEED }, { x: 0, z: 0 }, 0.2);

    expect(Math.hypot(after.x, after.z)).toBe(0);
  });

  it("no invierte la marcha al frenar", () => {
    const after = stepVelocity({ x: 0, z: -0.01 }, { x: 0, z: 0 }, DT);

    expect(after.z).toBe(0);
  });

  it("mantiene la velocidad máxima en diagonal", () => {
    const diagonal = MOVE_SPEED * Math.SQRT1_2;
    const after = simulate({ x: 0, z: 0 }, { x: diagonal, z: -diagonal }, 0.5);

    expect(Math.hypot(after.x, after.z)).toBeCloseTo(MOVE_SPEED, 5);
  });
});

describe("giro del avatar (AC-6)", () => {
  it("convierte la dirección en el ángulo al que mira el avatar", () => {
    expect(angleFromDirection({ x: 0, z: -1 })).toBeCloseTo(0, 6); // delante
    // En three.js rotation.y gira en sentido antihorario visto desde arriba:
    // mirar hacia +X exige -PI/2 y mirar hacia -X, +PI/2.
    expect(angleFromDirection({ x: 1, z: 0 })).toBeCloseTo(-Math.PI / 2, 6); // derecha
    expect(angleFromDirection({ x: -1, z: 0 })).toBeCloseTo(Math.PI / 2, 6); // izquierda
  });

  it("toma siempre el camino corto, incluso cruzando ±π", () => {
    expect(shortestAngleDelta(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(0.2, 6);
    expect(shortestAngleDelta(-Math.PI + 0.1, Math.PI - 0.1)).toBeCloseTo(-0.2, 6);
  });

  it("completa un giro de 180° en menos de 0,3 s", () => {
    let angle = 0;
    for (let t = 0; t < 0.3; t += DT) angle = turnToward(angle, Math.PI, DT);

    expect(Math.abs(shortestAngleDelta(angle, Math.PI))).toBeLessThan(0.01);
  });

  it("no se pasa del ángulo objetivo", () => {
    const angle = turnToward(0, 0.01, DT);

    expect(angle).toBeCloseTo(0.01, 6);
  });

  it("gira progresivamente: un solo fotograma no completa el giro", () => {
    const angle = turnToward(0, Math.PI, DT);

    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThan(Math.PI / 2);
  });
});
