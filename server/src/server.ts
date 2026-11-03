import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@office/shared";
import { OfficeRoom } from "./rooms/OfficeRoom";

/**
 * Ping cada segundo y un solo reintento: una conexión caída sin cierre limpio se detecta en ~2 s (spec 003 AC-15).
 * Cerrar o recargar la pestaña cierra el socket y se detecta al instante.
 * Un transporte nuevo por llamada: el constructor guarda su `http.Server` en el objeto de opciones.
 */
function createTransport(): WebSocketTransport {
  return new WebSocketTransport({ pingInterval: 1000, pingMaxRetries: 1 });
}

export function createGameServer(transport = createTransport()): Server {
  const server = new Server({ transport, greet: false });
  server.define(ROOM_NAME, OfficeRoom);
  return server;
}

export async function startServer(port: number): Promise<Server> {
  const transport = createTransport();
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
