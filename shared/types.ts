export const ROOM_NAME = "office";

export const DEFAULT_SERVER_PORT = 2567;
export const DEFAULT_CLIENT_PORT = 5173;

/** Frecuencia de envío de la posición propia mientras hay movimiento (spec 003, entre 10 y 15 Hz). */
export const SEND_RATE_HZ = 12;
/** Retraso con el que se dibujan los demás participantes, para interpolar entre instantáneas. */
export const INTERPOLATION_DELAY_MS = 120;

/** Mensajes de la sala. */
export const MSG = { move: "move", correction: "correction" } as const;

/** Cliente → servidor: posición y orientación deseadas del propio avatar. */
export type MoveMessage = { x: number; z: number; rotY: number };
/** Servidor → emisor: última posición válida tras rechazar un movimiento. */
export type CorrectionMessage = { x: number; z: number };
/** Opciones al entrar a la sala. */
export type JoinOptions = { name: string };

/** Códigos con los que el servidor rechaza la entrada. */
export const JOIN_ERROR = { invalidName: 4001, roomFull: 4002 } as const;

/** Datos visibles de un participante; el schema de la sala (`schema.ts`) tiene esta misma forma. */
export interface PlayerData {
  id: string;
  name: string;
  x: number;
  z: number;
  rotY: number;
  color: string;
}

export * from "./world";
export * from "./players";
export * from "./movementRules";
