import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import {
  AVATAR_GAP,
  CHAT,
  JOIN_ERROR,
  MAX_PLAYERS,
  MSG,
  ROOM_NAME,
  SPAWN,
  type ChatMessage,
  type ChatNotice,
  type ChatRejected,
  type CorrectionMessage,
} from "@office/shared";
import type { OfficeState } from "@office/shared/schema";
import { createGameServer } from "../server";
import type { OfficeRoom } from "./OfficeRoom";

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

  const createRoom = () => colyseus.createRoom<OfficeRoom>(ROOM_NAME);
  const players = (room: OfficeRoom) => (room.state as OfficeState).players;

  it("registra la sala bajo el nombre compartido (spec 001 AC-10)", async () => {
    const room = await createRoom();
    expect(room.roomName).toBe(ROOM_NAME);
  });

  describe("entrada", () => {
    it("crea al participante en el punto de entrada con su nombre y un color (AC-4)", async () => {
      const room = await createRoom();
      const client = await colyseus.connectTo(room, { name: "Ana" });

      const player = players(room).get(client.sessionId);
      expect(player).toMatchObject({ id: client.sessionId, name: "Ana", x: SPAWN.x, z: SPAWN.z, rotY: 0 });
      expect(player?.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("guarda el nombre sin los espacios de los extremos (AC-3)", async () => {
      const room = await createRoom();
      const client = await colyseus.connectTo(room, { name: "  Ana  " });
      expect(players(room).get(client.sessionId)?.name).toBe("Ana");
    });

    it.each([{ name: "" }, { name: "   " }, {}, { name: 42 }])(
      "rechaza el nombre vacío, solo de espacios o ausente: %j (AC-2)",
      async (options) => {
        // Una sala vacía se cierra tras un intento fallido: una sala por caso.
        const room = await createRoom();
        await expect(colyseus.connectTo(room, options)).rejects.toMatchObject({ code: JOIN_ERROR.invalidName });
        expect(players(room).size).toBe(0);
      },
    );

    it("rechaza nombres de más de 20 caracteres (AC-3)", async () => {
      const room = await createRoom();
      await expect(colyseus.connectTo(room, { name: "a".repeat(21) })).rejects.toMatchObject({
        code: JOIN_ERROR.invalidName,
      });
    });

    it("admite dos participantes con el mismo nombre como avatares distintos (AC-8)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Ana" });

      expect(players(room).size).toBe(2);
      expect(a.sessionId).not.toBe(b.sessionId);
      expect(players(room).get(a.sessionId)?.color).not.toBe(players(room).get(b.sessionId)?.color);
    });

    it("registra en consola la entrada con el nombre", async () => {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const room = await createRoom();
      const client = await colyseus.connectTo(room, { name: "Ana" });

      expect(log).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`Entra Ana.*${client.sessionId}`)));
    });
  });

  describe("presencia", () => {
    it("quien entra después recibe a los presentes en su posición y orientación actuales (AC-5)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const playerA = players(room).get(a.sessionId)!;
      playerA.x = 1.5;
      playerA.z = -2;
      playerA.rotY = 0.7;

      const b = await colyseus.connectTo(room, { name: "Bea" });
      await b.waitForInitialState();

      const seen = (b.state as OfficeState).players.get(a.sessionId);
      // Los números fraccionarios viajan como float32: se comparan con tolerancia.
      expect(seen).toMatchObject({ name: "Ana", x: 1.5, z: -2, color: playerA.color });
      expect(seen?.rotY).toBeCloseTo(0.7, 5);
    });

    it("quien ya estaba recibe al que llega (AC-5)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });

      await vi.waitFor(() => expect((a.state as OfficeState).players.get(b.sessionId)?.name).toBe("Bea"));
    });

    it("asigna colores distintos a todos los presentes (AC-6)", async () => {
      const room = await createRoom();
      for (let i = 0; i < MAX_PLAYERS; i++) await colyseus.connectTo(room, { name: `P${i}` });

      const colors = [...players(room).values()].map((p) => p.color);
      expect(new Set(colors).size).toBe(MAX_PLAYERS);
    });

    it("rechaza al 21.º participante con «sala completa» sin afectar a los demás (AC-19)", async () => {
      const room = await createRoom();
      const present = [];
      for (let i = 0; i < MAX_PLAYERS; i++) present.push(await colyseus.connectTo(room, { name: `P${i}` }));

      await expect(colyseus.connectTo(room, { name: "Uno más" })).rejects.toMatchObject({
        code: JOIN_ERROR.roomFull,
      });
      expect(players(room).size).toBe(MAX_PLAYERS);
      for (const client of present) expect(players(room).has(client.sessionId)).toBe(true);
    });

    it("no supera la capacidad aunque varios entren a la vez (AC-19)", async () => {
      const room = await createRoom();
      for (let i = 0; i < MAX_PLAYERS - 1; i++) await colyseus.connectTo(room, { name: `P${i}` });

      const results = await Promise.allSettled([
        colyseus.connectTo(room, { name: "X" }),
        colyseus.connectTo(room, { name: "Y" }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(players(room).size).toBe(MAX_PLAYERS);
    });

    it("dos entradas casi simultáneas: cada uno ve al otro una vez y con colores distintos (AC-20)", async () => {
      const room = await createRoom();
      const [a, b] = await Promise.all([
        colyseus.connectTo(room, { name: "Ana" }),
        colyseus.connectTo(room, { name: "Bea" }),
      ]);

      expect(players(room).size).toBe(2);
      await vi.waitFor(() => {
        expect((a.state as OfficeState).players.size).toBe(2);
        expect((b.state as OfficeState).players.size).toBe(2);
      });
      const colorA = (b.state as OfficeState).players.get(a.sessionId)?.color;
      const colorB = (a.state as OfficeState).players.get(b.sessionId)?.color;
      expect(colorA).toBeDefined();
      expect(colorA).not.toBe(colorB);
    });
  });

  describe("movimiento", () => {
    async function joinedPair() {
      const room = await createRoom();
      const mover = await colyseus.connectTo(room, { name: "Ana" });
      const watcher = await colyseus.connectTo(room, { name: "Bea" });
      return { room, mover, watcher };
    }

    it("acepta un movimiento válido y los demás lo reciben", async () => {
      const { room, mover, watcher } = await joinedPair();
      mover.send(MSG.move, { x: SPAWN.x + 0.2, z: SPAWN.z - 0.1, rotY: 1 });

      await vi.waitFor(() =>
        expect(players(room).get(mover.sessionId)).toMatchObject({ x: SPAWN.x + 0.2, z: SPAWN.z - 0.1, rotY: 1 }),
      );
      await vi.waitFor(() => {
        const seen = (watcher.state as OfficeState).players.get(mover.sessionId);
        expect(seen?.x).toBeCloseTo(SPAWN.x + 0.2, 5);
        expect(seen?.rotY).toBeCloseTo(1, 5);
      });
    });

    it.each([
      ["fuera de la sala", { x: SPAWN.x, z: 9 }],
      ["demasiado rápido", { x: SPAWN.x + 3, z: SPAWN.z }],
      ["dentro de un mueble", { x: 0.5, z: 2 }],
    ])("rechaza un movimiento %s y devuelve la última posición válida (AC-13)", async (_case, target) => {
      const { room, mover } = await joinedPair();
      const correction = mover.waitForMessage(MSG.correction);
      mover.send(MSG.move, { ...target, rotY: 0 });

      expect((await correction) as CorrectionMessage).toEqual({ x: SPAWN.x, z: SPAWN.z });
      expect(players(room).get(mover.sessionId)).toMatchObject({ x: SPAWN.x, z: SPAWN.z });
    });

    it("tras un rechazo sigue validando desde la última posición aceptada (AC-13)", async () => {
      const { room, mover } = await joinedPair();
      mover.send(MSG.move, { x: SPAWN.x + 0.2, z: SPAWN.z, rotY: 0 });
      await vi.waitFor(() => expect(players(room).get(mover.sessionId)?.x).toBeCloseTo(SPAWN.x + 0.2));

      const correction = mover.waitForMessage(MSG.correction);
      mover.send(MSG.move, { x: SPAWN.x + 4, z: SPAWN.z, rotY: 0 });
      expect(await correction).toEqual({ x: SPAWN.x + 0.2, z: SPAWN.z });

      mover.send(MSG.move, { x: SPAWN.x + 0.3, z: SPAWN.z, rotY: 0 });
      await vi.waitFor(() => expect(players(room).get(mover.sessionId)?.x).toBeCloseTo(SPAWN.x + 0.3));
    });

    it.each([["texto", "hola"], ["campos que faltan", { x: 1 }], ["tipos incorrectos", { x: "1", z: 2, rotY: 0 }], ["vacío", undefined]])(
      "descarta un mensaje mal formado (%s), lo registra y la sala sigue (AC-14)",
      async (_case, payload) => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { room, mover, watcher } = await joinedPair();

        mover.send(MSG.move, payload);

        await vi.waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining("mal formado")));
        expect(players(room).get(mover.sessionId)).toMatchObject({ x: SPAWN.x, z: SPAWN.z });

        const start = players(room).get(watcher.sessionId)!;
        const target = { x: start.x - 0.2, z: start.z };
        watcher.send(MSG.move, { ...target, rotY: 0 });
        await vi.waitFor(() => expect(players(room).get(watcher.sessionId)?.x).toBeCloseTo(target.x));
        expect(players(room).size).toBe(2);
      },
    );
  });

  describe("colisiones entre avatares", () => {
    const gap = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

    it("con el punto de entrada ocupado, el siguiente aparece en un hueco libre cercano (AC-24)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });

      const pa = players(room).get(a.sessionId)!;
      const pb = players(room).get(b.sessionId)!;
      expect(pa).toMatchObject({ x: SPAWN.x, z: SPAWN.z });
      expect(gap(pa, pb)).toBeGreaterThanOrEqual(AVATAR_GAP);
      expect(gap(pb, SPAWN)).toBeLessThan(AVATAR_GAP + 0.3);
    });

    /** `mover` en SPAWN avanza hacia `other` en pasos cortos (siempre dentro de la velocidad permitida). */
    async function approach() {
      const room = await createRoom();
      const mover = await colyseus.connectTo(room, { name: "Ana" });
      const other = await colyseus.connectTo(room, { name: "Bea" });
      const target = players(room).get(other.sessionId)!;
      const d = gap(SPAWN, target);
      const step = (k: number) => ({ x: SPAWN.x + ((target.x - SPAWN.x) / d) * k, z: SPAWN.z + ((target.z - SPAWN.z) / d) * k });
      return { room, mover, target: { x: target.x, z: target.z }, step };
    }

    it("rechaza meterse claramente dentro de otro avatar (AC-25)", async () => {
      const { room, mover, step } = await approach();
      const first = step(0.25);
      mover.send(MSG.move, { ...first, rotY: 0 });
      await vi.waitFor(() => expect(players(room).get(mover.sessionId)?.x).toBeCloseTo(first.x));

      const correction = mover.waitForMessage(MSG.correction);
      mover.send(MSG.move, { ...step(0.5), rotY: 0 });
      const back = (await correction) as CorrectionMessage;
      expect(back.x).toBeCloseTo(first.x);
      expect(back.z).toBeCloseTo(first.z);
    });

    it("acepta alejarse de otro avatar aunque sigan solapados (AC-23)", async () => {
      const { room, mover, step } = await approach();
      const near = step(0.25);
      mover.send(MSG.move, { ...near, rotY: 0 });
      await vi.waitFor(() => expect(players(room).get(mover.sessionId)?.x).toBeCloseTo(near.x));

      const away = step(0.1);
      mover.send(MSG.move, { ...away, rotY: 0 });
      await vi.waitFor(() => expect(players(room).get(mover.sessionId)?.x).toBeCloseTo(away.x));
    });
  });

  describe("chat", () => {
    /** Acumula los mensajes de un tipo que recibe `client`. */
    function inbox<T>(client: { onMessage(type: string, callback: (payload: T) => void): unknown }, type: string): T[] {
      const received: T[] = [];
      client.onMessage(type, (payload: T) => received.push(payload));
      return received;
    }

    it("difunde un mensaje a todos con autor, color, hora e id fijados por el servidor (AC-2, AC-11)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });
      const seenByA = inbox<ChatMessage>(a, MSG.chatMessage);
      const seenByB = inbox<ChatMessage>(b, MSG.chatMessage);

      const before = Date.now();
      a.send(MSG.chat, { text: "  hola  ", authorName: "Bea", authorId: b.sessionId, authorColor: "#000000" });

      await vi.waitFor(() => expect(seenByB).toHaveLength(1));
      await vi.waitFor(() => expect(seenByA).toHaveLength(1));
      const message = seenByB[0]!;
      expect(message).toMatchObject({
        authorId: a.sessionId,
        authorName: "Ana",
        authorColor: players(room).get(a.sessionId)?.color,
        text: "hola",
      });
      expect(message.sentAt).toBeGreaterThanOrEqual(before);
      expect(message.sentAt).toBeLessThanOrEqual(Date.now());
      expect(seenByA[0]).toEqual(message);
    });

    it("todos reciben los mensajes en el mismo orden y con ids crecientes (AC-3)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });
      const seenByA = inbox<ChatMessage>(a, MSG.chatMessage);
      const seenByB = inbox<ChatMessage>(b, MSG.chatMessage);

      a.send(MSG.chat, { text: "uno" });
      b.send(MSG.chat, { text: "dos" });
      a.send(MSG.chat, { text: "tres" });

      await vi.waitFor(() => expect(seenByA).toHaveLength(3));
      await vi.waitFor(() => expect(seenByB).toHaveLength(3));
      expect(seenByA).toEqual(seenByB);
      const ids = seenByA.map((m) => m.id);
      expect([...ids].sort((x, y) => x - y)).toEqual(ids);
      expect(new Set(ids).size).toBe(3);
    });

    it.each([
      ["vacío", { text: "" }],
      ["solo espacios", { text: "    " }],
      ["de 201 caracteres", { text: "a".repeat(201) }],
      ["sin texto", { msg: "hola" }],
      ["con texto no string", { text: 42 }],
      ["que no es objeto", "hola"],
    ])("descarta un mensaje %s, lo registra y la sala sigue (AC-4, AC-5, AC-12)", async (_case, payload) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });
      const seenByB = inbox<ChatMessage>(b, MSG.chatMessage);

      a.send(MSG.chat, payload);
      await vi.waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringContaining("Chat mal formado")));

      b.send(MSG.chat, { text: "sigo aquí" });
      await vi.waitFor(() => expect(seenByB.map((m) => m.text)).toEqual(["sigo aquí"]));
      expect(players(room).size).toBe(2);
    });

    it("al superar 5 mensajes en 5 s descarta el exceso y avisa solo al emisor (AC-13)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });
      const seenByB = inbox<ChatMessage>(b, MSG.chatMessage);
      const rejectedA = inbox<ChatRejected>(a, MSG.chatRejected);
      const rejectedB = inbox<ChatRejected>(b, MSG.chatRejected);

      for (let i = 1; i <= 6; i++) a.send(MSG.chat, { text: `m${i}` });
      await vi.waitFor(() => expect(rejectedA).toEqual([{ reason: "rateLimited" }]));

      b.send(MSG.chat, { text: "yo también" });
      await vi.waitFor(() => expect(seenByB.map((m) => m.text)).toEqual(["m1", "m2", "m3", "m4", "m5", "yo también"]));
      expect(rejectedB).toEqual([]);
    });

    it("entrega a quien lo pide los últimos 20 mensajes, también de quien ya salió, sin avisos (AC-1, AC-14)", async () => {
      const room = await createRoom();
      const watcher = await colyseus.connectTo(room, { name: "Vera" });
      const seen = inbox<ChatMessage>(watcher, MSG.chatMessage);
      const senders = [];
      for (let i = 0; i < 5; i++) senders.push(await colyseus.connectTo(room, { name: `P${i}` }));

      for (const [i, sender] of senders.entries()) {
        for (let j = 0; j < 5; j++) sender.send(MSG.chat, { text: `${i}-${j}` });
        await vi.waitFor(() => expect(seen).toHaveLength((i + 1) * 5));
      }
      await senders[4]!.leave();
      await vi.waitFor(() => expect(players(room).size).toBe(5));

      const late = await colyseus.connectTo(room, { name: "Lía" });
      const history = late.waitForMessage(MSG.chatHistory);
      late.send(MSG.chatHistory);
      const list = (await history) as ChatMessage[];

      expect(CHAT.historySize).toBe(20);
      expect(list).toEqual(seen.slice(-20));
      expect(list.some((m) => m.authorName === "P4")).toBe(true);
    });

    it("con la sala recién creada el historial está vacío (AC-1)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const history = a.waitForMessage(MSG.chatHistory);
      a.send(MSG.chatHistory);
      expect(await history).toEqual([]);
    });

    it("anuncia llegadas y salidas a los demás, no al propio participante (AC-16)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const noticesA = inbox<ChatNotice>(a, MSG.chatNotice);

      const b = await colyseus.connectTo(room, { name: "Bea" });
      const noticesB = inbox<ChatNotice>(b, MSG.chatNotice);
      await vi.waitFor(() => expect(noticesA).toMatchObject([{ kind: "joined", name: "Bea" }]));

      await b.leave();
      await vi.waitFor(() =>
        expect(noticesA).toMatchObject([
          { kind: "joined", name: "Bea" },
          { kind: "left", name: "Bea" },
        ]),
      );
      expect(noticesB).toEqual([]);
      expect(noticesA.every((n) => typeof n.sentAt === "number")).toBe(true);
    });
  });

  describe("salida", () => {
    it("al salir desaparece para los demás y se registra con su nombre (AC-15)", async () => {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      const b = await colyseus.connectTo(room, { name: "Bea" });
      await vi.waitFor(() => expect((b.state as OfficeState).players.has(a.sessionId)).toBe(true));

      await a.leave();

      await vi.waitFor(() => expect(players(room).has(a.sessionId)).toBe(false));
      await vi.waitFor(() => expect((b.state as OfficeState).players.has(a.sessionId)).toBe(false));
      expect(log).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`Sale Ana.*${a.sessionId}`)));
    });

    it("una salida sin consentimiento (conexión cortada) también borra al participante (AC-15)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      await colyseus.connectTo(room, { name: "Bea" });

      await a.leave(false);

      await vi.waitFor(() => expect(players(room).has(a.sessionId)).toBe(false));
    });

    it("al salir y volver aparece una sola vez, en el punto de entrada (AC-16)", async () => {
      const room = await createRoom();
      const first = await colyseus.connectTo(room, { name: "Ana" });
      const stay = await colyseus.connectTo(room, { name: "Bea" });
      first.send(MSG.move, { x: SPAWN.x + 0.2, z: SPAWN.z, rotY: 0 });
      await vi.waitFor(() => expect(players(room).get(first.sessionId)?.x).toBeCloseTo(SPAWN.x + 0.2));
      await first.leave();
      await vi.waitFor(() => expect(players(room).size).toBe(1));

      const again = await colyseus.connectTo(room, { name: "Ana" });

      const named = [...players(room).values()].filter((p) => p.name === "Ana");
      expect(named).toHaveLength(1);
      expect(named[0]).toMatchObject({ id: again.sessionId, x: SPAWN.x, z: SPAWN.z });
      await vi.waitFor(() => expect((stay.state as OfficeState).players.size).toBe(2));
    });

    it("el color de quien sale queda libre para el siguiente (AC-6)", async () => {
      const room = await createRoom();
      const a = await colyseus.connectTo(room, { name: "Ana" });
      await colyseus.connectTo(room, { name: "Bea" });
      const freed = players(room).get(a.sessionId)!.color;

      await a.leave();
      await vi.waitFor(() => expect(players(room).size).toBe(1));
      const c = await colyseus.connectTo(room, { name: "Cris" });

      expect(players(room).get(c.sessionId)?.color).toBe(freed);
    });
  });
});
