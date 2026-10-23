import { ColyseusSDK } from "@colyseus/sdk";
import { ROOM_NAME } from "@office/shared";

interface JoinedRoom {
  sessionId: string;
  onLeave(callback: (code: number) => void): unknown;
}

export interface ConnectDeps {
  createClient(url: string): { joinOrCreate(roomName: string): Promise<JoinedRoom> };
  log(message: string): void;
  error(message: string, cause: unknown): void;
}

const defaultDeps: ConnectDeps = {
  createClient: (url) => new ColyseusSDK(url),
  log: (message) => console.log(message),
  error: (message, cause) => console.error(message, cause),
};

export async function connectToServer(url: string, deps: ConnectDeps = defaultDeps): Promise<void> {
  try {
    const room = await deps.createClient(url).joinOrCreate(ROOM_NAME);
    deps.log(`[net] Conectado al servidor (sesión ${room.sessionId})`);
    room.onLeave((code) => deps.log(`[net] Desconectado del servidor (código ${code})`));
  } catch (cause) {
    deps.error(`[net] No se pudo conectar al servidor en ${url}`, cause);
  }
}
