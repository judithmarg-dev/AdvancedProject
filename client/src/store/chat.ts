import { createStore, useStore } from "zustand";
import { CHAT, type ChatMessage, type ChatNotice } from "@office/shared";

/** Línea del panel: un mensaje de un participante o un aviso de llegada/salida (spec 004 AC-16). */
export type ChatEntry = { kind: "message"; message: ChatMessage } | { kind: "notice"; notice: ChatNotice; key: number };

/** Burbuja sobre un avatar: texto completo y hora local (ms, `performance.now`) en que caduca. */
export type Bubble = { text: string; expiresAt: number };

export interface ChatState {
  entries: ChatEntry[];
  collapsed: boolean;
  /** Mensajes de otros recibidos con el panel plegado (AC-17). */
  unread: number;
  /** Último rechazo del servidor por ritmo (hora local), para el aviso breve (AC-13). */
  rateLimitedAt: number | null;
  /** Burbuja vigente de cada autor (por id de sesión). */
  bubbles: Record<string, Bubble>;
  history(messages: readonly ChatMessage[]): void;
  received(message: ChatMessage, now: number, selfId: string | null): void;
  notice(notice: ChatNotice): void;
  rateLimited(now: number): void;
  setCollapsed(collapsed: boolean): void;
  playerLeft(id: string): void;
  reset(): void;
}

/** Texto de la burbuja si sigue vigente en `now`; si no, `null` (AC-8). */
export function activeBubble(bubble: Bubble | undefined, now: number): string | null {
  return bubble && now < bubble.expiresAt ? bubble.text : null;
}

const keep = (entries: ChatEntry[]) => entries.slice(-CHAT.panelSize);

export function createChatStore() {
  let noticeKey = 0;
  return createStore<ChatState>()((set) => ({
    entries: [],
    collapsed: false,
    unread: 0,
    rateLimitedAt: null,
    bubbles: {},

    // El historial es anterior a todo lo recibido en directo; si se solapan, gana la copia en directo.
    history: (messages) =>
      set((state) => {
        const live = new Set(state.entries.flatMap((e) => (e.kind === "message" ? [e.message.id] : [])));
        const older: ChatEntry[] = messages.filter((m) => !live.has(m.id)).map((message) => ({ kind: "message", message }));
        return { entries: keep([...older, ...state.entries]) };
      }),

    received: (message, now, selfId) =>
      set((state) => ({
        entries: keep([...state.entries, { kind: "message", message }]),
        unread: state.collapsed && message.authorId !== selfId ? state.unread + 1 : state.unread,
        bubbles: { ...state.bubbles, [message.authorId]: { text: message.text, expiresAt: now + CHAT.bubbleMs } },
      })),

    notice: (notice) => set((state) => ({ entries: keep([...state.entries, { kind: "notice", notice, key: ++noticeKey }]) })),

    rateLimited: (now) => set({ rateLimitedAt: now }),

    setCollapsed: (collapsed) => set((state) => ({ collapsed, unread: collapsed ? state.unread : 0 })),

    playerLeft: (id) =>
      set((state) => {
        const { [id]: _gone, ...rest } = state.bubbles;
        return { bubbles: rest };
      }),

    reset: () => set({ entries: [], unread: 0, rateLimitedAt: null, bubbles: {} }),
  }));
}

/** Chat único de la página. */
export const chatStore = createChatStore();

export function useChat<T>(selector: (state: ChatState) => T): T {
  return useStore(chatStore, selector);
}
