import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@office/shared";
import { OfficeRoom } from "./rooms/OfficeRoom";

export function createGameServer(transport = new WebSocketTransport()): Server {
  const server = new Server({ transport, greet: false });
  server.define(ROOM_NAME, OfficeRoom);
  return server;
}

export async function startServer(port: number): Promise<Server> {
  const transport = new WebSocketTransport();
  const server = createGameServer(transport);
  try {
    // Colyseus solo imprime los errores del http.Server y `listen` no se resuelve
    // ni rechaza si el puerto está ocupado: lo escuchamos nosotros.
    await new Promise<void>((resolve, reject) => {
      transport.server?.once("error", reject);
      server.listen(port).then(resolve, reject);
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
      console.error(`[Servidor] El puerto ${port} ya está en uso`);
    }
    await server.gracefullyShutdown(false);
    throw err;
  }
  console.log(`[Servidor] Escuchando en ws://localhost:${port}`);
  return server;
}
