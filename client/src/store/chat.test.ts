import { beforeEach, describe, expect, it } from "vitest";
import { CHAT, type ChatMessage, type ChatNotice } from "@office/shared";
import { activeBubble, createChatStore } from "./chat";

const SELF = "me";

function message(id: number, authorId = "ana", text = `m${id}`): ChatMessage {
  return { id, authorId, authorName: authorId.toUpperCase(), authorColor: "#A9CBE8", text, sentAt: 1_000 * id };
}
const notice = (kind: ChatNotice["kind"], name: string): ChatNotice => ({ kind, name, sentAt: 0 });

describe("store del chat", () => {
  let store: ReturnType<typeof createChatStore>;
  beforeEach(() => {
    store = createChatStore();
  });
  const state = () => store.getState();
  const texts = () => state().entries.map((e) => (e.kind === "message" ? e.message.text : `${e.notice.kind}:${e.notice.name}`));

  it("empieza vacío y desplegado", () => {
    expect(state()).toMatchObject({ entries: [], collapsed: false, unread: 0, rateLimitedAt: null, bubbles: {} });
  });

  describe("historial (AC-1)", () => {
    it("carga el historial al entrar, sin burbujas ni no leídos", () => {
      state().setCollapsed(true);
      state().history([message(1), message(2)]);
      expect(texts()).toEqual(["m1", "m2"]);
      expect(state().bubbles).toEqual({});
      expect(state().unread).toBe(0);
    });

    it("si ya llegó algún mensaje en directo, no lo duplica y lo deja después del historial", () => {
      state().received(message(3), 0, SELF);
      state().history([message(2), message(3)]);
      expect(texts()).toEqual(["m2", "m3"]);
    });
  });

  describe("mensajes", () => {
    it("añade los mensajes en orden de llegada (AC-2)", () => {
      state().received(message(1), 0, SELF);
      state().received(message(2, "bea"), 0, SELF);
      expect(texts()).toEqual(["m1", "m2"]);
    });

    it(`conserva solo las últimas ${CHAT.panelSize} entradas, mensajes y avisos`, () => {
      for (let i = 1; i <= CHAT.panelSize; i++) state().received(message(i), 0, SELF);
      state().notice(notice("joined", "Zoe"));
      expect(state().entries).toHaveLength(CHAT.panelSize);
      expect(texts()[0]).toBe("m2");
      expect(texts().at(-1)).toBe("joined:Zoe");
    });
  });

  describe("burbujas (AC-7, AC-8)", () => {
    it("cada mensaje deja una burbuja sobre su autor, también la propia", () => {
      state().received(message(1, "ana", "hola"), 100, SELF);
      state().received(message(2, SELF, "qué tal"), 100, SELF);
      expect(activeBubble(state().bubbles.ana, 100)).toBe("hola");
      expect(activeBubble(state().bubbles[SELF], 100)).toBe("qué tal");
    });

    it("caduca a los 5 s", () => {
      expect(CHAT.bubbleMs).toBe(5000);
      state().received(message(1, "ana", "hola"), 1000, SELF);
      expect(activeBubble(state().bubbles.ana, 1000 + 4999)).toBe("hola");
      expect(activeBubble(state().bubbles.ana, 1000 + 5000)).toBeNull();
      expect(activeBubble(undefined, 0)).toBeNull();
    });

    it("un mensaje nuevo del mismo autor la sustituye y reinicia el tiempo", () => {
      state().received(message(1, "ana", "uno"), 0, SELF);
      state().received(message(2, "ana", "dos"), 4000, SELF);
      expect(activeBubble(state().bubbles.ana, 8000)).toBe("dos");
    });

    it("los avisos no crean burbuja (AC-16)", () => {
      state().notice(notice("joined", "Bea"));
      expect(state().bubbles).toEqual({});
    });
  });

  describe("avisos de llegada y salida (AC-16)", () => {
    it("se añaden al panel", () => {
      state().notice(notice("joined", "Bea"));
      state().notice(notice("left", "Bea"));
      expect(texts()).toEqual(["joined:Bea", "left:Bea"]);
    });
  });

  describe("plegado y no leídos (AC-17)", () => {
    it("desplegado no acumula no leídos", () => {
      state().received(message(1), 0, SELF);
      expect(state().unread).toBe(0);
    });

    it("plegado cuenta solo mensajes de otros participantes, no avisos ni los propios", () => {
      state().setCollapsed(true);
      state().received(message(1, "ana"), 0, SELF);
      state().received(message(2, "bea"), 0, SELF);
      state().received(message(3, SELF), 0, SELF);
      state().notice(notice("joined", "Zoe"));
      expect(state().unread).toBe(2);
    });

    it("plegado las burbujas siguen apareciendo", () => {
      state().setCollapsed(true);
      state().received(message(1, "ana", "hola"), 0, SELF);
      expect(activeBubble(state().bubbles.ana, 0)).toBe("hola");
    });

    it("al desplegar el contador vuelve a cero", () => {
      state().setCollapsed(true);
      state().received(message(1), 0, SELF);
      state().setCollapsed(false);
      expect(state()).toMatchObject({ collapsed: false, unread: 0 });
    });
  });

  it("registra cuándo el servidor rechazó por ritmo (AC-13)", () => {
    state().rateLimited(1234);
    expect(state().rateLimitedAt).toBe(1234);
  });

  it("al salir un participante conserva sus mensajes y borra su burbuja (AC-14)", () => {
    state().received(message(1, "ana", "hola"), 0, SELF);
    state().playerLeft("ana");
    expect(texts()).toEqual(["hola"]);
    expect(state().bubbles.ana).toBeUndefined();
  });

  it("reset lo deja como al principio, conservando si estaba plegado (AC-15)", () => {
    state().setCollapsed(true);
    state().received(message(1), 0, SELF);
    state().rateLimited(5);
    state().reset();
    expect(state()).toMatchObject({ entries: [], unread: 0, rateLimitedAt: null, bubbles: {}, collapsed: true });
  });
});
