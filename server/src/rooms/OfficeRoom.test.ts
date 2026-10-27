import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { ROOM_NAME } from "@office/shared";
import { createGameServer } from "../server";

describe("OfficeRoom", () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot(createGameServer());
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await colyseus.cleanup();
  });

  it("registra la sala bajo el nombre compartido (AC-10)", async () => {
    const room = await colyseus.createRoom(ROOM_NAME);
    expect(room.roomName).toBe(ROOM_NAME);
  });

  it("registra en consola cuando un cliente se conecta (AC-4)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const room = await colyseus.createRoom(ROOM_NAME);
    const client = await colyseus.connectTo(room);

    expect(log).toHaveBeenCalledWith(expect.stringContaining("Cliente conectado"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining(client.sessionId));
  });

  it("registra en consola cuando un cliente se desconecta (AC-5)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const room = await colyseus.createRoom(ROOM_NAME);
    const client = await colyseus.connectTo(room);

    await client.leave();

    await vi.waitFor(() =>
      expect(log).toHaveBeenCalledWith(expect.stringContaining("Cliente desconectado")),
    );
  });
});
