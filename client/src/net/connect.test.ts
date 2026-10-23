import { describe, expect, it, vi } from "vitest";
import { ROOM_NAME } from "@office/shared";
import { connectToServer, type ConnectDeps } from "./connect";

type JoinOrCreate = ReturnType<ConnectDeps["createClient"]>["joinOrCreate"];

function makeDeps(joinOrCreate: JoinOrCreate) {
  const log = vi.fn();
  const error = vi.fn();
  const createClient = vi.fn(() => ({ joinOrCreate }));
  return { deps: { createClient, log, error } satisfies ConnectDeps, log, error, createClient };
}

function fakeRoom() {
  let leave: (code: number) => void = () => {};
  const room = {
    sessionId: "abc123",
    onLeave: (cb: (code: number) => void) => {
      leave = cb;
    },
  };
  return { room, leave: (code: number) => leave(code) };
}

describe("connectToServer", () => {
  it("se une a la sala compartida y registra la conexión (AC-3)", async () => {
    const { room } = fakeRoom();
    const joinOrCreate = vi.fn(async () => room);
    const { deps, log, createClient } = makeDeps(joinOrCreate);

    await connectToServer("ws://localhost:2567", deps);

    expect(createClient).toHaveBeenCalledWith("ws://localhost:2567");
    expect(joinOrCreate).toHaveBeenCalledWith(ROOM_NAME);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Conectado al servidor"));
    expect(log).toHaveBeenCalledWith(expect.stringContaining("abc123"));
  });

  it("registra la desconexión sin romper nada (AC-5)", async () => {
    const { room, leave } = fakeRoom();
    const { deps, log } = makeDeps(async () => room);

    await connectToServer("ws://localhost:2567", deps);
    leave(1006);

    expect(log).toHaveBeenCalledWith(expect.stringContaining("Desconectado del servidor"));
  });

  it("registra un error claro y no lanza si no puede conectar (AC-7)", async () => {
    const { deps, error } = makeDeps(async () => {
      throw new Error("fetch failed");
    });

    await expect(connectToServer("ws://localhost:2567", deps)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(expect.stringContaining("No se pudo conectar"), expect.any(Error));
  });
});
