import { describe, expect, it } from "vitest";
import { CAMERA_OFFSET, CAMERA_TARGET_HEIGHT } from "@office/shared";
import { cameraLookAt, desiredCameraPosition, followCamera } from "./camera";

const DT = 1 / 60;

function follow(from: { x: number; y: number; z: number }, avatar: { x: number; z: number }, seconds: number) {
  let current = from;
  for (let t = 0; t < seconds; t += DT) current = followCamera(current, desiredCameraPosition(avatar), DT);
  return current;
}

describe("encuadre de la cámara (AC-7)", () => {
  it("se coloca por detrás y por encima del avatar", () => {
    const avatar = { x: 2, z: -1 };
    const desired = desiredCameraPosition(avatar);

    expect(desired.x).toBeCloseTo(avatar.x, 6);
    expect(desired.z).toBeCloseTo(avatar.z + CAMERA_OFFSET.back, 6);
    expect(desired.y).toBeCloseTo(CAMERA_OFFSET.up, 6);
  });

  it("mira al avatar a la altura del cuerpo", () => {
    const target = cameraLookAt({ x: -3, z: 4 });

    expect(target).toEqual({ x: -3, y: CAMERA_TARGET_HEIGHT, z: 4 });
  });
});

describe("seguimiento suavizado (AC-7)", () => {
  it("converge al encuadre deseado", () => {
    const avatar = { x: 5, z: 2 };
    const after = follow(desiredCameraPosition({ x: 0, z: 0 }), avatar, 2);
    const desired = desiredCameraPosition(avatar);

    expect(after.x).toBeCloseTo(desired.x, 3);
    expect(after.z).toBeCloseTo(desired.z, 3);
  });

  it("no salta: un solo fotograma recorre solo una parte del camino", () => {
    const avatar = { x: 5, z: 0 };
    const start = desiredCameraPosition({ x: 0, z: 0 });
    const after = followCamera(start, desiredCameraPosition(avatar), DT);

    expect(after.x).toBeGreaterThan(start.x);
    expect(after.x).toBeLessThan(desiredCameraPosition(avatar).x / 2);
  });

  it("no se pasa del objetivo", () => {
    const avatar = { x: 5, z: 0 };
    const after = follow(desiredCameraPosition({ x: 0, z: 0 }), avatar, 2);

    expect(after.x).toBeLessThanOrEqual(desiredCameraPosition(avatar).x + 1e-6);
  });

  it("mantiene al avatar por delante de la cámara mientras se aleja", () => {
    const avatar = { x: 0, z: -5 };
    const after = follow(desiredCameraPosition({ x: 0, z: 0 }), avatar, 0.5);

    expect(after.z).toBeGreaterThan(avatar.z);
  });

  it("da el mismo resultado con fotogramas de distinta duración", () => {
    const avatar = { x: 4, z: 0 };
    const start = desiredCameraPosition({ x: 0, z: 0 });
    const desired = desiredCameraPosition(avatar);

    let fine = start;
    for (let i = 0; i < 60; i += 1) fine = followCamera(fine, desired, 1 / 120);
    let coarse = start;
    for (let i = 0; i < 15; i += 1) coarse = followCamera(coarse, desired, 1 / 30);

    expect(coarse.x).toBeCloseTo(fine.x, 2);
  });
});
