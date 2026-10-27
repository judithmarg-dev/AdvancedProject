import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColyseusSDK } from "@colyseus/sdk";
import type { Server } from "@colyseus/core";
import { ROOM_NAME } from "@office/shared";
import { startServer } from "./server";

const PORT = 2571;
const running: Server[] = [];
const children: ChildProcess[] = [];

// Arranca src/index.ts como proceso aparte: un reinicio real es un proceso nuevo.
function spawnServer(port: number) {
  const child = spawn(process.execPath, ["--import", "tsx", fileURLToPath(new URL("./index.ts", import.meta.url))], {
    env: { ...process.env, PORT: String(port) },
  });
  children.push(child);
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => (stdout += chunk));
  child.stderr?.on("data", (chunk) => (stderr += chunk));
  const listening = vi.waitFor(() => expect(stdout).toContain(`ws://localhost:${port}`), { timeout: 15000, interval: 100 });
  return { child, listening, stderr: () => stderr };
}

async function kill(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  await once(child, "exit");
}

async function start(port = PORT) {
  const server = await startServer(port);
  running.push(server);
  return server;
}

async function stop(server: Server) {
  await server.gracefullyShutdown(false);
  running.splice(running.indexOf(server), 1);
}

describe("startServer", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    for (const server of [...running]) await stop(server);
    for (const child of children.splice(0)) await kill(child);
  });

  it("informa en consola la dirección donde escucha (AC-1)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await start();
    expect(log).toHaveBeenCalledWith(expect.stringContaining(`ws://localhost:${PORT}`));
  });

  it("permite unirse, detenerse y volver a arrancar (AC-6)", async () => {
    const first = spawnServer(PORT + 1);
    await first.listening;
    const room = await new ColyseusSDK(`ws://localhost:${PORT + 1}`).joinOrCreate(ROOM_NAME);
    expect(room.sessionId).toBeTruthy();
    await kill(first.child);

    const second = spawnServer(PORT + 1);
    await second.listening;
    const again = await new ColyseusSDK(`ws://localhost:${PORT + 1}`).joinOrCreate(ROOM_NAME);
    expect(again.sessionId).toBeTruthy();
  }, 40000);

  it("rechaza con EADDRINUSE y lo informa si el puerto está ocupado (AC-12)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await start();

    await expect(startServer(PORT)).rejects.toMatchObject({ code: "EADDRINUSE" });
    expect(error).toHaveBeenCalledWith(expect.stringContaining("puerto"));
  });

  it("sale con código 1 e informa del puerto en uso al arrancar el proceso (AC-12)", async () => {
    await start(PORT + 2);
    const { child, stderr } = spawnServer(PORT + 2);
    const [code] = await once(child, "exit");
    expect(code).toBe(1);
    expect(stderr()).toContain("puerto");
  }, 20000);
});
