import { describe, expect, it } from "vitest";
import { AV, parseAvAccess, pickVideoPeers, volumeForDistance } from "./av";

describe("volumen por distancia (spec 005 AC-9..AC-11)", () => {
  it("fija 2 m de volumen pleno y 8 m de silencio", () => {
    expect(AV.fullVolumeDistance).toBe(2);
    expect(AV.silenceDistance).toBe(8);
  });

  it("es pleno hasta 2 m", () => {
    expect(volumeForDistance(0)).toBe(1);
    expect(volumeForDistance(2)).toBe(1);
  });

  it("es 0 a 8 m y más allá", () => {
    expect(volumeForDistance(8)).toBe(0);
    expect(volumeForDistance(20)).toBe(0);
  });

  it("baja de forma continua y sin subir entre 2 y 8 m", () => {
    let previous = 1;
    for (let d = 2; d <= 8; d += 0.05) {
      const v = volumeForDistance(d);
      expect(v).toBeLessThanOrEqual(previous + 1e-9);
      expect(previous - v).toBeLessThan(0.03); // sin saltos
      previous = v;
    }
    expect(volumeForDistance(5)).toBeGreaterThan(0);
    expect(volumeForDistance(5)).toBeLessThan(1);
  });

  it("trata distancias no válidas como silencio", () => {
    expect(volumeForDistance(Number.NaN)).toBe(0);
    expect(volumeForDistance(-1)).toBe(1);
  });
});

describe("videos visibles (spec 005 AC-14)", () => {
  const self = { x: 0, z: 0 };

  it("solo incluye a quien está a 8 m o menos, del más cercano al más lejano", () => {
    const peers = [
      { id: "lejos", x: 9, z: 0 },
      { id: "b", x: 3, z: 0 },
      { id: "a", x: 0, z: 1 },
      { id: "borde", x: 0, z: 8 },
    ];
    expect(pickVideoPeers(self, peers)).toEqual(["a", "b", "borde"]);
  });

  it("muestra como mucho 4", () => {
    const peers = [1, 2, 3, 4, 5, 6].map((d) => ({ id: `p${d}`, x: d, z: 0 }));
    expect(AV.maxVideos).toBe(4);
    expect(pickVideoPeers(self, peers)).toEqual(["p1", "p2", "p3", "p4"]);
  });
});

describe("respuesta de acceso (spec 005 AC-2, AC-3)", () => {
  it("acepta un acceso concedido", () => {
    expect(parseAvAccess({ ok: true, url: "ws://localhost:7880", token: "t" })).toEqual({
      ok: true,
      url: "ws://localhost:7880",
      token: "t",
    });
  });

  it("acepta una denegación con motivo conocido", () => {
    expect(parseAvAccess({ ok: false, reason: "disabled" })).toEqual({ ok: false, reason: "disabled" });
  });

  it("convierte cualquier otra cosa en error", () => {
    for (const raw of [null, 3, { ok: true, url: "", token: "t" }, { ok: true, url: "u" }, { ok: false, reason: "x" }]) {
      expect(parseAvAccess(raw)).toEqual({ ok: false, reason: "error" });
    }
  });
});
