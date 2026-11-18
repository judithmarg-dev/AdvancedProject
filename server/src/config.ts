import { fileURLToPath } from "node:url";
import { DEFAULT_SERVER_PORT } from "@office/shared";

export function loadEnv() {
  try {
    process.loadEnvFile(fileURLToPath(new URL("../../.env", import.meta.url)));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export function getPort(env: NodeJS.ProcessEnv = process.env): number {
  const port = Number(env.PORT ?? DEFAULT_SERVER_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT inválido: ${env.PORT}`);
  }
  return port;
}

export type LiveKitConfig = { url: string; apiKey: string; apiSecret: string };

/** Conexión con LiveKit desde `.env`; `null` si falta alguna variable (la voz queda desactivada, spec 005 AC-18). */
export function getLiveKitConfig(env: NodeJS.ProcessEnv = process.env): LiveKitConfig | null {
  const url = env.LIVEKIT_URL?.trim();
  const apiKey = env.LIVEKIT_API_KEY?.trim();
  const apiSecret = env.LIVEKIT_API_SECRET?.trim();
  return url && apiKey && apiSecret ? { url, apiKey, apiSecret } : null;
}
