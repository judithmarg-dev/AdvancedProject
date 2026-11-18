import { describe, expect, it, vi } from "vitest";
import { TokenVerifier } from "livekit-server-sdk";
import { AV, ROOM_NAME } from "@office/shared";
import { getLiveKitConfig } from "./config";
import { createAccessIssuer } from "./livekit";

const config = { url: "ws://localhost:7880", apiKey: "devkey", apiSecret: "secret-de-pruebas-con-longitud-suficiente" };

describe("configuración de LiveKit (spec 005 AC-18)", () => {
  it("lee URL, clave y secreto del entorno", () => {
    expect(
      getLiveKitConfig({ LIVEKIT_URL: config.url, LIVEKIT_API_KEY: config.apiKey, LIVEKIT_API_SECRET: config.apiSecret }),
    ).toEqual(config);
  });

  it("sin alguna de las tres variables, la voz queda desactivada", () => {
    expect(getLiveKitConfig({})).toBeNull();
    expect(getLiveKitConfig({ LIVEKIT_URL: config.url, LIVEKIT_API_KEY: config.apiKey })).toBeNull();
    expect(getLiveKitConfig({ LIVEKIT_URL: " ", LIVEKIT_API_KEY: "k", LIVEKIT_API_SECRET: "s" })).toBeNull();
  });
});

describe("acceso a LiveKit (spec 005 AC-2)", () => {
  it("firma un acceso para la sala de la oficina con la identidad y el nombre dados", async () => {
    const issuer = createAccessIssuer(config);
    const access = await issuer.issue("sesion-1", "Ana");
    expect(access.url).toBe(config.url);

    const claims = await new TokenVerifier(config.apiKey, config.apiSecret).verify(access.token);
    expect(claims.sub).toBe("sesion-1");
    expect(claims.name).toBe("Ana");
    expect(claims.video).toMatchObject({ roomJoin: true, room: ROOM_NAME, canPublish: true, canSubscribe: true });
    expect(claims.video?.roomCreate).toBeFalsy();
    expect(claims.video?.roomAdmin).toBeFalsy();
    expect((claims.exp ?? 0) - (claims.nbf ?? claims.iat ?? 0)).toBeLessThanOrEqual(AV.accessTtlSeconds);
  });

  it("un acceso firmado con otro secreto no es válido", async () => {
    const access = await createAccessIssuer({ ...config, apiSecret: "otro-secreto-distinto-y-suficientemente-largo" }).issue("x", "X");
    await expect(new TokenVerifier(config.apiKey, config.apiSecret).verify(access.token)).rejects.toThrow();
  });
});

describe("arranque con o sin LiveKit (spec 005 AC-18)", () => {
  it("sin configuración avisa de que la voz está desactivada", async () => {
    const { roomOptionsFromEnv } = await import("./server");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(roomOptionsFromEnv({}).avIssuer).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("desactivado"));
    warn.mockRestore();
  });

  it("con configuración no escribe el secreto en la consola", async () => {
    const { roomOptionsFromEnv } = await import("./server");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const options = roomOptionsFromEnv({
      LIVEKIT_URL: config.url,
      LIVEKIT_API_KEY: config.apiKey,
      LIVEKIT_API_SECRET: config.apiSecret,
    });
    expect(options.avIssuer).not.toBeNull();
    const printed = log.mock.calls.flat().join(" ");
    expect(printed).toContain(config.url);
    expect(printed).not.toContain(config.apiSecret);
    log.mockRestore();
  });
});
