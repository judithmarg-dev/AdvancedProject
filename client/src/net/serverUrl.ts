import { DEFAULT_SERVER_PORT } from "@office/shared";

/** Dirección del servidor de juego; configurable con `VITE_SERVER_URL` (spec 001). */
export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL ?? `ws://localhost:${DEFAULT_SERVER_PORT}`;
