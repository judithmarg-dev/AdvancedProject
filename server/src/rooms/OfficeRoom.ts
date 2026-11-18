import { Client, Room, ServerError } from "@colyseus/core";
import {
  CHAT,
  JOIN_ERROR,
  MAX_PLAYERS,
  MSG,
  allowChat,
  findSpawn,
  normalizeName,
  overlapsAvatar,
  parseChatSend,
  parseMoveMessage,
  pickColor,
  validateMove,
  type AvAccess,
  type ChatMessage,
  type ChatNotice,
  type ChatRejected,
  type CorrectionMessage,
} from "@office/shared";
import { OfficeState, Player } from "@office/shared/schema";
import type { AccessIssuer } from "../livekit";

/** Configuración del servidor para la sala: quién emite el acceso a audio/video (`null` = voz desactivada). */
export type OfficeRoomOptions = { avIssuer: AccessIssuer | null };

type JoinAuth = { name: string };

/** Sala única de la oficina. El servidor es la autoridad sobre quién está, dónde y con qué color. */
export class OfficeRoom extends Room<{ state: OfficeState }> {
  state = new OfficeState();
  /** Hora (ms) del último movimiento aceptado de cada participante, para validar la velocidad. */
  private lastMoveAt = new Map<string, number>();
  /** Horas (ms) de los últimos mensajes de chat aceptados de cada participante, para limitar el ritmo. */
  private chatTimes = new Map<string, number[]>();
  /** Últimos mensajes de chat, para quien entra después (spec 004 AC-1). Solo en memoria. */
  private chatHistory: ChatMessage[] = [];
  private nextChatId = 1;
  /** Lo fija el servidor al definir la sala (`withOptions`), nunca las opciones de un cliente. */
  protected avIssuer: AccessIssuer | null = null;

  /** Sala con la configuración del servidor fijada en la clase: un cliente no puede sustituirla al crearla. */
  static withOptions(options: OfficeRoomOptions): typeof OfficeRoom {
    return class ConfiguredOfficeRoom extends OfficeRoom {
      protected avIssuer = options.avIssuer;
    };
  }

  onCreate() {
    this.onMessage(MSG.move, (client: Client, raw: unknown) => this.handleMove(client, raw));
    this.onMessage(MSG.chat, (client: Client, raw: unknown) => this.handleChat(client, raw));
    this.onMessage(MSG.chatHistory, (client: Client) => client.send(MSG.chatHistory, this.chatHistory));
    this.onMessage(MSG.avAccess, (client: Client) => void this.handleAvAccess(client));
  }

  onAuth(_client: Client, options: unknown): JoinAuth {
    const name = normalizeName((options as { name?: unknown } | undefined)?.name);
    if (name === null) throw new ServerError(JOIN_ERROR.invalidName, "El nombre no es válido");
    return { name };
  }

  onJoin(client: Client, _options: unknown, auth: JoinAuth) {
    // Se comprueba aquí y no con `maxClients`: con una sala llena el matchmaker crearía otra y partiría la
    // oficina. `onJoin` es síncrono, así que dos entradas a la vez no pueden superar el límite.
    if (this.state.players.size >= MAX_PLAYERS) throw new ServerError(JOIN_ERROR.roomFull, "La sala está completa");

    const color = pickColor([...this.state.players.values()].map((p) => p.color));
    // Punto de entrada o, si está ocupado, el hueco libre más cercano (AC-24).
    const spawn = findSpawn(this.otherPositions(client.sessionId));
    const player = new Player({ id: client.sessionId, name: auth.name, x: spawn.x, z: spawn.z, rotY: 0, color });
    this.state.players.set(client.sessionId, player);
    this.lastMoveAt.set(client.sessionId, Date.now());
    this.notice("joined", auth.name, client);
    console.log(`[OfficeRoom] Entra ${auth.name} (${client.sessionId})`);
  }

  private handleMove(client: Client, raw: unknown) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const move = parseMoveMessage(raw);
    if (!move) {
      console.warn(`[OfficeRoom] Movimiento mal formado de ${player.name} (${client.sessionId}), descartado`);
      return;
    }

    const now = Date.now();
    const elapsed = now - (this.lastMoveAt.get(client.sessionId) ?? now);
    const from = { x: player.x, z: player.z };
    if (!validateMove(from, move, elapsed) || overlapsAvatar(from, move, this.otherPositions(client.sessionId))) {
      const correction: CorrectionMessage = { x: player.x, z: player.z };
      client.send(MSG.correction, correction);
      return;
    }

    player.x = move.x;
    player.z = move.z;
    player.rotY = move.rotY;
    this.lastMoveAt.set(client.sessionId, now);
  }

  /** El servidor fija autor, color, hora e id; el cliente solo aporta el texto (spec 004 AC-11). */
  private handleChat(client: Client, raw: unknown) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const send = parseChatSend(raw);
    if (!send) {
      console.warn(`[OfficeRoom] Chat mal formado de ${player.name} (${client.sessionId}), descartado`);
      return;
    }

    const now = Date.now();
    const recent = (this.chatTimes.get(client.sessionId) ?? []).filter((t) => now - t < CHAT.rateWindowMs);
    if (!allowChat(recent, now)) {
      const rejected: ChatRejected = { reason: "rateLimited" };
      client.send(MSG.chatRejected, rejected);
      return;
    }
    recent.push(now);
    this.chatTimes.set(client.sessionId, recent);

    const message: ChatMessage = {
      id: this.nextChatId++,
      authorId: client.sessionId,
      authorName: player.name,
      authorColor: player.color,
      text: send.text,
      sentAt: now,
    };
    this.chatHistory = [...this.chatHistory, message].slice(-CHAT.historySize);
    this.broadcast(MSG.chatMessage, message);
  }

  /**
   * Acceso al canal de audio/video solo para quien está en la sala, con su id de sesión y su nombre; lo que
   * mande el cliente se ignora (spec 005 AC-2). Sin configuración o si la firma falla, lo dice (AC-3).
   */
  private async handleAvAccess(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    let reply: AvAccess;
    if (!this.avIssuer) {
      reply = { ok: false, reason: "disabled" };
    } else {
      try {
        reply = { ok: true, ...(await this.avIssuer.issue(client.sessionId, player.name)) };
      } catch (err) {
        console.error(`[OfficeRoom] No se pudo emitir el acceso de audio/video para ${player.name}:`, (err as Error).message);
        reply = { ok: false, reason: "error" };
      }
    }
    client.send(MSG.avAccess, reply);
  }

  /** Aviso de llegada o salida para los demás; no forma parte del historial (spec 004 AC-16). */
  private notice(kind: ChatNotice["kind"], name: string, except?: Client) {
    const notice: ChatNotice = { kind, name, sentAt: Date.now() };
    this.broadcast(MSG.chatNotice, notice, except ? { except } : undefined);
  }

  private otherPositions(selfId: string) {
    return [...this.state.players.values()].filter((p) => p.id !== selfId).map((p) => ({ x: p.x, z: p.z }));
  }

  /** Cerrar, recargar o perder la conexión es salir: sin reconexión (spec 003). */
  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    this.state.players.delete(client.sessionId);
    this.lastMoveAt.delete(client.sessionId);
    this.chatTimes.delete(client.sessionId);
    if (player) this.notice("left", player.name);
    console.log(`[OfficeRoom] Sale ${player?.name ?? "?"} (${client.sessionId})`);
  }
}
