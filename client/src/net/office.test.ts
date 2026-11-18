import { describe, expect, it, vi } from "vitest";
import { JOIN_ERROR, MSG, ROOM_NAME, type ChatMessage, type ChatNotice, type PlayerData } from "@office/shared";
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
    chatReset: vi.fn(),
    chatHistory: vi.fn(),
    chatMessage: vi.fn(),
    chatNotice: vi.fn(),
    chatRejected: vi.fn(),
    avAccess: vi.fn(),
    avStop: vi.fn(),
  } satisfies OfficeSink;
  return { deps, sink, joinOrCreate, events: () => events! };
}

describe("joinOffice", () => {
  it("se une a la sala compartida con el nombre y registra la conexión (AC-4, spec 001 AC-3)", async () => {
    const { room } = fakeRoom("abc123");
    const { deps, sink, joinOrCreate, events } = setup(async () => room);

    const session = await joinOffice(URL, "Ana", deps, sink);
    events().onAdd(player("abc123", { name: "Ana", color: "#F4B6A6", x: -1.25, z: 4.5 }));

    expect(deps.createClient).toHaveBeenCalledWith(URL);
    expect(joinOrCreate).toHaveBeenCalledWith(ROOM_NAME, { name: "Ana" });
    // El avatar propio empieza donde lo colocó el servidor (spec 003 AC-24).
    expect(sink.joined).toHaveBeenCalledWith("abc123", { name: "Ana", color: "#F4B6A6", spawn: { x: -1.25, z: 4.5 } });
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

  describe("chat (spec 004)", () => {
    const chat = (extra: Partial<ChatMessage> = {}): ChatMessage => ({
      id: 7,
      authorId: "bea",
      authorName: "Bea",
      authorColor: "#A9CBE8",
      text: "hola",
      sentAt: 1_700_000_000_000,
      ...extra,
    });

    async function joined() {
      const fake = fakeRoom("me");
      const { deps, sink } = setup(async () => fake.room);
      const session = await joinOffice(URL, "Ana", deps, sink);
      return { ...fake, sink, session };
    }

    it("envía el texto como mensaje de chat (AC-2)", async () => {
      const { room, session } = await joined();
      session?.sendChat("hola");
      expect(room.send).toHaveBeenCalledWith(MSG.chat, { text: "hola" });
    });

    it("al entrar vacía el chat y pide el historial (AC-1, AC-15)", async () => {
      const { room, sink } = await joined();
      expect(sink.chatReset).toHaveBeenCalledTimes(1);
      expect(room.send).toHaveBeenCalledWith(MSG.chatHistory, undefined);
    });

    it("entrega el historial descartando entradas mal formadas (AC-1)", async () => {
      const { message, sink } = await joined();
      message(MSG.chatHistory, [chat({ id: 1 }), { id: "x" }, chat({ id: 2 })]);
      message(MSG.chatHistory, "no es una lista");
      expect(sink.chatHistory).toHaveBeenCalledTimes(1);
      expect(sink.chatHistory).toHaveBeenCalledWith([chat({ id: 1 }), chat({ id: 2 })]);
    });

    it("entrega cada mensaje con la hora local y el id propio, y descarta los mal formados (AC-2)", async () => {
      const { message, sink } = await joined();
      message(MSG.chatMessage, chat());
      message(MSG.chatMessage, { ...chat(), text: 3 });
      message(MSG.chatMessage, null);
      expect(sink.chatMessage).toHaveBeenCalledTimes(1);
      expect(sink.chatMessage).toHaveBeenCalledWith(chat(), 1000, "me");
    });

    it("entrega los avisos de llegada y salida y descarta los mal formados (AC-16)", async () => {
      const { message, sink } = await joined();
      const notice: ChatNotice = { kind: "left", name: "Bea", sentAt: 5 };
      message(MSG.chatNotice, notice);
      message(MSG.chatNotice, { kind: "explota", name: "Bea", sentAt: 5 });
      expect(sink.chatNotice).toHaveBeenCalledTimes(1);
      expect(sink.chatNotice).toHaveBeenCalledWith(notice);
    });

    it("avisa cuando el servidor rechaza por ritmo (AC-13)", async () => {
      const { message, sink } = await joined();
      message(MSG.chatRejected, { reason: "rateLimited" });
      expect(sink.chatRejected).toHaveBeenCalledWith(1000);
    });

    it("al perder la conexión vacía el chat (AC-15)", async () => {
      const { drop, sink } = await joined();
      drop(1006);
      expect(sink.chatReset).toHaveBeenCalledTimes(2);
    });
  });

  describe("audio/video (spec 005)", () => {
    async function joined() {
      const fake = fakeRoom("me");
      const { deps, sink } = setup(async () => fake.room);
      const session = await joinOffice(URL, "Ana", deps, sink);
      return { ...fake, sink, session };
    }

    it("al entrar pide el acceso al canal sin pasos extra (AC-1)", async () => {
      const { room } = await joined();
      expect(room.send).toHaveBeenCalledWith(MSG.avAccess, undefined);
    });

    it("entrega la respuesta validada; lo mal formado cuenta como error (AC-1, AC-3)", async () => {
      const { message, sink } = await joined();
      message(MSG.avAccess, { ok: true, url: "ws://lk", token: "t" });
      expect(sink.avAccess).toHaveBeenLastCalledWith({ ok: true, url: "ws://lk", token: "t" });
      message(MSG.avAccess, { ok: true });
      expect(sink.avAccess).toHaveBeenLastCalledWith({ ok: false, reason: "error" });
    });

    it("al perder la conexión sale también del canal de audio/video (AC-16)", async () => {
      const { drop, sink } = await joined();
      drop(1006);
      expect(sink.avStop).toHaveBeenCalledTimes(1);
      expect(sink.connectionLost).toHaveBeenCalled();
    });

    it("al salir voluntariamente también sale del canal (AC-16)", async () => {
      const { session, sink } = await joined();
      await session?.leave();
      expect(sink.avStop).toHaveBeenCalledTimes(1);
    });
  });
});
