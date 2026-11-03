import { Client, Room, ServerError } from "@colyseus/core";
import {
  JOIN_ERROR,
  MAX_PLAYERS,
  MSG,
  SPAWN,
  normalizeName,
  parseMoveMessage,
  pickColor,
  validateMove,
  type CorrectionMessage,
} from "@office/shared";
import { OfficeState, Player } from "@office/shared/schema";

type JoinAuth = { name: string };

/** Sala única de la oficina. El servidor es la autoridad sobre quién está, dónde y con qué color. */
export class OfficeRoom extends Room<{ state: OfficeState }> {
  state = new OfficeState();
  /** Hora (ms) del último movimiento aceptado de cada participante, para validar la velocidad. */
  private lastMoveAt = new Map<string, number>();

  onCreate() {
    this.onMessage(MSG.move, (client: Client, raw: unknown) => this.handleMove(client, raw));
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
    const player = new Player({ id: client.sessionId, name: auth.name, x: SPAWN.x, z: SPAWN.z, rotY: 0, color });
    this.state.players.set(client.sessionId, player);
    this.lastMoveAt.set(client.sessionId, Date.now());
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
    if (!validateMove({ x: player.x, z: player.z }, move, elapsed)) {
      const correction: CorrectionMessage = { x: player.x, z: player.z };
      client.send(MSG.correction, correction);
      return;
    }

    player.x = move.x;
    player.z = move.z;
    player.rotY = move.rotY;
    this.lastMoveAt.set(client.sessionId, now);
  }

  /** Cerrar, recargar o perder la conexión es salir: sin reconexión (spec 003). */
  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    this.state.players.delete(client.sessionId);
    this.lastMoveAt.delete(client.sessionId);
    console.log(`[OfficeRoom] Sale ${player?.name ?? "?"} (${client.sessionId})`);
  }
}
