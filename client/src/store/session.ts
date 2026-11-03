import { createStore, useStore } from "zustand";

/** Pantalla de entrada → conectando → dentro de la sala. Sin servidor no se sale de la entrada (spec 003). */
export type SessionPhase = "entry" | "connecting" | "inRoom";

/** Lo que React necesita de otro participante; su posición vive fuera de React (`net/remotePlayers.ts`). */
export type RemoteInfo = { name: string; color: string };

export const CONNECTION_LOST_MESSAGE = "Se perdió la conexión con el servidor";

export interface SessionState {
  phase: SessionPhase;
  /** Último nombre con el que se intentó entrar; se conserva tras un fallo (AC-17, AC-18). */
  name: string;
  error: string | null;
  selfId: string | null;
  /** Nombre y color propios tal como los fijó el servidor. */
  self: RemoteInfo | null;
  remotes: Record<string, RemoteInfo>;
  startJoin(name: string): void;
  joined(selfId: string, self: RemoteInfo): void;
  joinFailed(message: string): void;
  connectionLost(): void;
  playerAdded(id: string, info: RemoteInfo): void;
  playerRemoved(id: string): void;
}

export function createSessionStore() {
  return createStore<SessionState>()((set) => ({
    phase: "entry",
    name: "",
    error: null,
    selfId: null,
    self: null,
    remotes: {},
    startJoin: (name) => set({ phase: "connecting", name, error: null }),
    joined: (selfId, self) => set({ phase: "inRoom", selfId, self }),
    joinFailed: (message) => set({ phase: "entry", error: message, selfId: null, self: null, remotes: {} }),
    connectionLost: () =>
      set({ phase: "entry", error: CONNECTION_LOST_MESSAGE, selfId: null, self: null, remotes: {} }),
    playerAdded: (id, info) => set((state) => ({ remotes: { ...state.remotes, [id]: info } })),
    playerRemoved: (id) =>
      set((state) => {
        const { [id]: _removed, ...rest } = state.remotes;
        return { remotes: rest };
      }),
  }));
}

/** Sesión única de la página. */
export const sessionStore = createSessionStore();

export function useSession<T>(selector: (state: SessionState) => T): T {
  return useStore(sessionStore, selector);
}
