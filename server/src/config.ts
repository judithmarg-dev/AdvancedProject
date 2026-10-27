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
