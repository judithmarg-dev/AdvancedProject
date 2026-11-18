import { Callbacks, ColyseusSDK, type Room } from "@colyseus/sdk";
import {
  JOIN_ERROR,
  MSG,
  ROOM_NAME,
  parseAvAccess,
  type AvAccess,
  type ChatMessage,
  type ChatSend,
  type ChatNotice,
  type CorrectionMessage,
  type JoinOptions,
  type MoveMessage,
  type PlayerData,
} from "@office/shared";
import type { OfficeState } from "@office/shared/schema";
import { chatStore } from "../store/chat";
import { voice } from "./voiceInstance";
import { sessionStore, type RemoteInfo, type SelfInfo } from "../store/session";
import { remotePlayers, type PlayerPose } from "./remotePlayers";

/** Lo que este módulo usa de una sala del SDK; permite probarlo sin servidor. */
export interface JoinedRoom {
  sessionId: string;
  send(type: string, payload: unknown): void;
  onMessage(type: string, callback: (payload: unknown) => void): unknown;
  onLeave(callback: (code: number) => void): unknown;
  leave(consented?: boolean): Promise<unknown>;
}

export interface PlayerEvents {
  onAdd(player: PlayerData): void;
  onChange(player: PlayerData): void;
  onRemove(id: string): void;
}

export interface OfficeDeps<R extends JoinedRoom = JoinedRoom> {
  createClient(url: string): { joinOrCreate(roomName: string, options: JoinOptions): Promise<R> };
  observePlayers(room: R, events: PlayerEvents): void;
  log(message: string): void;
  error(message: string, cause: unknown): void;
  now(): number;
}

/** A dónde van los eventos de la sala: el store (lo que React pinta) y el registro de posiciones. */
export interface OfficeSink {
  /** Se llama cuando el propio participante aparece en el estado, ya con el color asignado. */
  joined(selfId: string, self: SelfInfo): void;
  joinFailed(message: string): void;
  connectionLost(): void;
  playerAdded(id: string, info: RemoteInfo): void;
  playerRemoved(id: string): void;
  trackPlayer(id: string, time: number, pose: PlayerPose): void;
  untrackPlayer(id: string): void;
  /** Chat (spec 004): vaciar al entrar y al perder la conexión, y lo que llega del servidor. */
  chatReset(): void;
  chatHistory(messages: ChatMessage[]): void;
  chatMessage(message: ChatMessage, now: number, selfId: string): void;
  chatNotice(notice: ChatNotice): void;
  chatRejected(now: number): void;
  /** Audio/video (spec 005): acceso concedido o denegado, y salir del canal al salir de la sala. */
  avAccess(access: AvAccess): void;
  avStop(): void;
}

export interface OfficeSession {
  sessionId: string;
  sendMove(move: MoveMessage): void;
  sendChat(text: string): void;
  onCorrection(callback: (correction: CorrectionMessage) => void): void;
  leave(): Promise<void>;
}

export const JOIN_ERROR_MESSAGES = {
  roomFull: "La sala está completa",
  invalidName: "El nombre no es válido",
  unreachable: "No se pudo conectar con el servidor",
} as const;

function joinErrorMessage(cause: unknown): string {
  const code = (cause as { code?: unknown } | null)?.code;
  if (code === JOIN_ERROR.roomFull) return JOIN_ERROR_MESSAGES.roomFull;
  if (code === JOIN_ERROR.invalidName) return JOIN_ERROR_MESSAGES.invalidName;
  return JOIN_ERROR_MESSAGES.unreachable;
}

function parseCorrection(raw: unknown): CorrectionMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { x, z } = raw as Record<string, unknown>;
  return typeof x === "number" && Number.isFinite(x) && typeof z === "number" && Number.isFinite(z) ? { x, z } : null;
}

const isObject = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === "object" && raw !== null && !Array.isArray(raw);
const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Mensaje de chat si el payload tiene la forma de `ChatMessage`; si no, `null`. */
function parseChatMessage(raw: unknown): ChatMessage | null {
  if (!isObject(raw)) return null;
  const { id, authorId, authorName, authorColor, text, sentAt } = raw;
  if (!isFiniteNumber(id) || !isFiniteNumber(sentAt)) return null;
  if (typeof authorId !== "string" || typeof authorName !== "string") return null;
  if (typeof authorColor !== "string" || typeof text !== "string") return null;
  return { id, authorId, authorName, authorColor, text, sentAt };
}

function parseChatNotice(raw: unknown): ChatNotice | null {
  if (!isObject(raw)) return null;
  const { kind, name, sentAt } = raw;
  if ((kind !== "joined" && kind !== "left") || typeof name !== "string" || !isFiniteNumber(sentAt)) return null;
  return { kind, name, sentAt };
}

const poseOf = (p: PlayerData): PlayerPose => ({ x: p.x, z: p.z, rotY: p.rotY });

/** Entra a la sala con `name`. Devuelve `null` (tras avisar al sink) si no se pudo entrar. */
export async function joinOffice<R extends JoinedRoom>(
  url: string,
  name: string,
  deps: OfficeDeps<R>,
  sink: OfficeSink,
): Promise<OfficeSession | null> {
  let room: R;
  try {
    room = await deps.createClient(url).joinOrCreate(ROOM_NAME, { name });
  } catch (cause) {
    deps.error(`[net] No se pudo conectar al servidor en ${url}`, cause);
    sink.joinFailed(joinErrorMessage(cause));
    return null;
  }

  const selfId = room.sessionId;
  const names = new Map<string, string>();
  let correctionCallback: (correction: CorrectionMessage) => void = () => {};
  let leaving = false;

  deps.log(`[net] Conectado al servidor (sesión ${selfId})`);

  deps.observePlayers(room, {
    onAdd(player) {
      if (player.id === selfId) {
        sink.joined(selfId, { name: player.name, color: player.color, spawn: { x: player.x, z: player.z } });
        return;
      }
      names.set(player.id, player.name);
      sink.playerAdded(player.id, { name: player.name, color: player.color });
      sink.trackPlayer(player.id, deps.now(), poseOf(player));
      deps.log(`[net] Entra ${player.name} (${player.id})`);
    },
    onChange(player) {
      if (player.id === selfId) return;
      sink.trackPlayer(player.id, deps.now(), poseOf(player));
    },
    onRemove(id) {
      if (id === selfId) return;
      sink.playerRemoved(id);
      sink.untrackPlayer(id);
      deps.log(`[net] Sale ${names.get(id) ?? "?"} (${id})`);
      names.delete(id);
    },
  });

  room.onMessage(MSG.correction, (raw) => {
    const correction = parseCorrection(raw);
    if (correction) correctionCallback(correction);
  });

  room.onMessage(MSG.chatHistory, (raw) => {
    if (!Array.isArray(raw)) return;
    sink.chatHistory(raw.flatMap((item) => parseChatMessage(item) ?? []));
  });
  room.onMessage(MSG.chatMessage, (raw) => {
    const message = parseChatMessage(raw);
    if (message) sink.chatMessage(message, deps.now(), selfId);
  });
  room.onMessage(MSG.chatNotice, (raw) => {
    const notice = parseChatNotice(raw);
    if (notice) sink.chatNotice(notice);
  });
  room.onMessage(MSG.chatRejected, () => sink.chatRejected(deps.now()));

  // El panel empieza de nuevo en cada entrada; el historial se pide cuando ya hay quien lo escuche (AC-1, AC-15).
  sink.chatReset();
  room.send(MSG.chatHistory, undefined);

  // Unirse al canal de audio/video sin pasos extra (spec 005 AC-1).
  room.onMessage(MSG.avAccess, (raw) => sink.avAccess(parseAvAccess(raw)));
  room.send(MSG.avAccess, undefined);

  room.onLeave((code) => {
    deps.log(`[net] Desconectado del servidor (código ${code})`);
    sink.chatReset();
    sink.avStop();
    for (const id of names.keys()) sink.untrackPlayer(id);
    names.clear();
    if (!leaving) sink.connectionLost();
  });

  return {
    sessionId: selfId,
    sendMove: (move) => room.send(MSG.move, move),
    sendChat: (text) => room.send(MSG.chat, { text } satisfies ChatSend),
    onCorrection: (callback) => {
      correctionCallback = callback;
    },
    leave: async () => {
      leaving = true;
      await room.leave();
    },
  };
}

type OfficeRoom = Room<unknown, OfficeState>;

const defaultDeps: OfficeDeps<OfficeRoom> = {
  createClient: (url) => {
    const sdk = new ColyseusSDK(url);
    return { joinOrCreate: (roomName, options) => sdk.joinOrCreate<OfficeState>(roomName, options) };
  },
  observePlayers: (room, events) => {
    const callbacks = Callbacks.get(room);
    callbacks.onAdd("players", (player) => {
      events.onAdd(player);
      callbacks.onChange(player, () => events.onChange(player));
    });
    callbacks.onRemove("players", (_player, id) => events.onRemove(id));
  },
  log: (message) => console.log(message),
  error: (message, cause) => console.error(message, cause),
  now: () => performance.now(),
};

const defaultSink: OfficeSink = {
  joined: (selfId, self) => sessionStore.getState().joined(selfId, self),
  joinFailed: (message) => sessionStore.getState().joinFailed(message),
  connectionLost: () => sessionStore.getState().connectionLost(),
  playerAdded: (id, info) => sessionStore.getState().playerAdded(id, info),
  playerRemoved: (id) => {
    sessionStore.getState().playerRemoved(id);
    chatStore.getState().playerLeft(id);
  },
  trackPlayer: (id, time, pose) => remotePlayers.track(id, time, pose),
  untrackPlayer: (id) => remotePlayers.untrack(id),
  chatReset: () => chatStore.getState().reset(),
  chatHistory: (messages) => chatStore.getState().history(messages),
  chatMessage: (message, now, selfId) => chatStore.getState().received(message, now, selfId),
  chatNotice: (notice) => chatStore.getState().notice(notice),
  chatRejected: (now) => chatStore.getState().rateLimited(now),
  avAccess: (access) => void voice.start(access),
  avStop: () => void voice.stop(),
};

/** Entrada real desde la UI: SDK de Colyseus, store de la sesión y registro de posiciones. */
export function enterOffice(url: string, name: string): Promise<OfficeSession | null> {
  sessionStore.getState().startJoin(name);
  return joinOffice(url, name, defaultDeps, defaultSink);
}
