import { Client, Room } from "@colyseus/core";

export class OfficeRoom extends Room {
  onJoin(client: Client) {
    console.log(`[OfficeRoom] Cliente conectado: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    console.log(`[OfficeRoom] Cliente desconectado: ${client.sessionId}`);
  }
}
