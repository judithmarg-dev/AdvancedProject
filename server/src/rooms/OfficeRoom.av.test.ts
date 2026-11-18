import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ColyseusTestServer } from "@colyseus/testing";
import { MSG, ROOM_NAME, type AvAccess } from "@office/shared";
import { createGameServer } from "../server";
import type { OfficeRoom } from "./OfficeRoom";

describe("OfficeRoom · acceso a audio/video (spec 005)", () => {
  let colyseus: ColyseusTestServer;
  const issued: { identity: string; name: string }[] = [];
  const issuer = {
    issue: async (identity: string, name: string) => {
      issued.push({ identity, name });
      return { url: "ws://lk.test", token: `token-${identity}` };
    },
  };

  beforeAll(async () => {
    // `boot` ignora el puerto con una instancia de `Server` y chocaría con OfficeRoom.test.ts (2568).
    const server = createGameServer(undefined, { avIssuer: issuer });
    await server.listen(2583);
    colyseus = new ColyseusTestServer(server);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    issued.length = 0;
    await colyseus.cleanup();
  });

  it("concede a quien está en la sala un acceso con su identidad y su nombre (AC-2)", async () => {
    const room = await colyseus.createRoom<OfficeRoom>(ROOM_NAME);
    const a = await colyseus.connectTo(room, { name: "Ana" });
    const reply = a.waitForMessage(MSG.avAccess);
    a.send(MSG.avAccess);

    expect(await reply).toEqual({ ok: true, url: "ws://lk.test", token: `token-${a.sessionId}` } satisfies AvAccess);
    expect(issued).toEqual([{ identity: a.sessionId, name: "Ana" }]);
  });

  it("ignora la identidad o el nombre que proponga el cliente (AC-2)", async () => {
    const room = await colyseus.createRoom<OfficeRoom>(ROOM_NAME);
    const a = await colyseus.connectTo(room, { name: "Ana" });
    const reply = a.waitForMessage(MSG.avAccess);
    a.send(MSG.avAccess, { identity: "otro", name: "Otro" });
    await reply;
    expect(issued).toEqual([{ identity: a.sessionId, name: "Ana" }]);
  });

  it("si la firma falla responde con error y la sala sigue (AC-3)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.spyOn(issuer, "issue").mockRejectedValueOnce(new Error("boom"));
    const room = await colyseus.createRoom<OfficeRoom>(ROOM_NAME);
    const a = await colyseus.connectTo(room, { name: "Ana" });
    const reply = a.waitForMessage(MSG.avAccess);
    a.send(MSG.avAccess);
    expect(await reply).toEqual({ ok: false, reason: "error" });
    expect(failing).toHaveBeenCalled();
    expect(room.state.players.size).toBe(1);
  });
});
