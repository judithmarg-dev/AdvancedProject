import { describe, expect, it, vi } from "vitest";
import { JOIN_ERROR, MSG, ROOM_NAME, type PlayerData } from "@office/shared";
import { JOIN_ERROR_MESSAGES, joinOffice, type JoinedRoom, type OfficeDeps, type OfficeSink, type PlayerEvents } from "./office";

const URL = "ws://localhost:2567";

function player(id: string, extra: Partial<PlayerData> = {}): PlayerData {
  return { id, name: id.toUpperCase(), x: 0, z: 0, rotY: 0, color: "#A9CBE8", ...extra };
}

function fakeRoom(sessionId = "me") {
  const handlers = new Map<string, (payload: unknown) => void>();
  let leaveCb: (code: number) => void = () => {};
  const room = {
    sessionId,
    send: vi.fn(),
    onMessage: (type: string, cb: (payload: unknown) => void) => void handlers.set(type, cb),
    onLeave: (cb: (code: number) => void) => void (leaveCb = cb),
    leave: vi.fn(async () => leaveCb(1000)),
  } satisfies JoinedRoom;
  return {
    room,
    message: (type: string, payload: unknown) => handlers.get(type)?.(payload),
    drop: (code: number) => leaveCb(code),
  };
}

function setup(join: (name: string, options: unknown) => Promise<JoinedRoom>) {
  let events: PlayerEvents | undefined;
  const joinOrCreate = vi.fn(join);
  const deps = {
    createClient: vi.fn(() => ({ joinOrCreate })),
    observePlayers: (_room: JoinedRoom, e: PlayerEvents) => void (events = e),
    log: vi.fn(),
    error: vi.fn(),
    now: () => 1000,
  } satisfies OfficeDeps;
  const sink = {
    joined: vi.fn(),
    joinFailed: vi.fn(),
    connectionLost: vi.fn(),
    playerAdded: vi.fn(),
    playerRemoved: vi.fn(),
    trackPlayer: vi.fn(),
    untrackPlayer: vi.fn(),
  } satisfies OfficeSink;
  return { deps, sink, joinOrCreate, events: () => events! };
}

describe("joinOffice", () => {
  it("se une a la sala compartida con el nombre y registra la conexión (AC-4, spec 001 AC-3)", async () => {
    const { room } = fakeRoom("abc123");
    const { deps, sink, joinOrCreate, events } = setup(async () => room);

    const session = await joinOffice(URL, "Ana", deps, sink);
    events().onAdd(player("abc123", { name: "Ana", color: "#F4B6A6" }));

    expect(deps.createClient).toHaveBeenCalledWith(URL);
    expect(joinOrCreate).toHaveBeenCalledWith(ROOM_NAME, { name: "Ana" });
    expect(sink.joined).toHaveBeenCalledWith("abc123", { name: "Ana", color: "#F4B6A6" });
    expect(session?.sessionId).toBe("abc123");
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("abc123"));
  });

  it("da de alta a los demás con nombre y color, lo registra en consola e ignora al propio (AC-5)", async () => {
    const { room } = fakeRoom("me");
    const { deps, sink, events } = setup(async () => room);
    await joinOffice(URL, "Ana", deps, sink);

    events().onAdd(player("me"));
    events().onAdd(player("bea", { name: "Bea", x: 1, z: 2, rotY: 0.5, color: "#F4B6A6" }));

    expect(sink.playerAdded).toHaveBeenCalledTimes(1);
    expect(sink.playerAdded).toHaveBeenCalledWith("bea", { name: "Bea", color: "#F4B6A6" });
    expect(sink.trackPlayer).toHaveBeenCalledWith("bea", 1000, { x: 1, z: 2, rotY: 0.5 });
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("Entra Bea"));
  });

  it("pasa cada cambio de posición de los demás al registro de instantáneas (AC-9)", async () => {
    const { room } = fakeRoom("me");
    const { deps, sink, events } = setup(async () => room);
    await joinOffice(URL, "Ana", deps, sink);

    events().onChange(player("bea", { x: 3, z: -1, rotY: 1 }));
    events().onChange(player("me", { x: 9 }));

    expect(sink.trackPlayer).toHaveBeenCalledTimes(1);
    expect(sink.trackPlayer).toHaveBeenCalledWith("bea", 1000, { x: 3, z: -1, rotY: 1 });
  });

  it("da de baja a quien sale y lo registra en consola con su nombre (AC-15)", async () => {
    const { room } = fakeRoom("me");
    const { deps, sink, events } = setup(async () => room);
    await joinOffice(URL, "Ana", deps, sink);
    events().onAdd(player("bea", { name: "Bea" }));

    events().onRemove("bea");

    expect(sink.playerRemoved).toHaveBeenCalledWith("bea");
    expect(sink.untrackPlayer).toHaveBeenCalledWith("bea");
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("Sale Bea"));
  });

  it("envía la posición propia como mensaje de movimiento (AC-10)", async () => {
    const { room } = fakeRoom();
    const { deps, sink } = setup(async () => room);
    const session = await joinOffice(URL, "Ana", deps, sink);

    session?.sendMove({ x: 1, z: 2, rotY: 3 });

    expect(room.send).toHaveBeenCalledWith(MSG.move, { x: 1, z: 2, rotY: 3 });
  });

  it("entrega las correcciones del servidor y descarta las mal formadas (AC-13)", async () => {
    const { room, message } = fakeRoom();
    const { deps, sink } = setup(async () => room);
    const session = await joinOffice(URL, "Ana", deps, sink);
    const onCorrection = vi.fn();
    session?.onCorrection(onCorrection);

    message(MSG.correction, { x: -2, z: 4.5 });
    message(MSG.correction, { x: "?" });

    expect(onCorrection).toHaveBeenCalledTimes(1);
    expect(onCorrection).toHaveBeenCalledWith({ x: -2, z: 4.5 });
  });

  it.each([
    [JOIN_ERROR.roomFull, JOIN_ERROR_MESSAGES.roomFull],
    [JOIN_ERROR.invalidName, JOIN_ERROR_MESSAGES.invalidName],
  ])("traduce el rechazo %i del servidor a un aviso (AC-19, AC-2)", async (code, message) => {
    const { deps, sink } = setup(async () => {
      throw Object.assign(new Error("rechazado"), { code });
    });

    await expect(joinOffice(URL, "Ana", deps, sink)).resolves.toBeNull();

    expect(sink.joinFailed).toHaveBeenCalledWith(message);
  });

  it("si el servidor no responde avisa, lo registra y no lanza (AC-17, spec 001 AC-7)", async () => {
    const { deps, sink } = setup(async () => {
      throw new Error("fetch failed");
    });

    await expect(joinOffice(URL, "Ana", deps, sink)).resolves.toBeNull();

    expect(sink.joinFailed).toHaveBeenCalledWith(JOIN_ERROR_MESSAGES.unreachable);
    expect(deps.error).toHaveBeenCalledWith(expect.stringContaining("No se pudo conectar"), expect.any(Error));
  });

  it("al perder la conexión avisa y lo registra (AC-18, spec 001 AC-5)", async () => {
    const { room, drop } = fakeRoom();
    const { deps, sink } = setup(async () => room);
    await joinOffice(URL, "Ana", deps, sink);

    drop(1006);

    expect(sink.connectionLost).toHaveBeenCalledTimes(1);
    expect(deps.log).toHaveBeenCalledWith(expect.stringContaining("Desconectado del servidor"));
  });

  it("salir a propósito no se trata como conexión perdida", async () => {
    const { room } = fakeRoom();
    const { deps, sink } = setup(async () => room);
    const session = await joinOffice(URL, "Ana", deps, sink);

    await session?.leave();

    expect(sink.connectionLost).not.toHaveBeenCalled();
  });
});
