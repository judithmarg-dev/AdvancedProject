/**
 * Estado sincronizado de la sala (spec 003). Lo instancia el servidor; el cliente solo importa sus tipos
 * (`import type`), así que el código del schema no viaja en el paquete del navegador.
 */
import { schema, t, type SchemaType } from "@colyseus/schema";
import type { PlayerData } from "./types";

export const Player = schema(
  {
    id: t.string(),
    name: t.string(),
    x: t.number(),
    z: t.number(),
    rotY: t.number(),
    color: t.string(),
  },
  "Player",
);
export type Player = SchemaType<typeof Player>;

export const OfficeState = schema(
  {
    players: t.map(Player),
  },
  "OfficeState",
);
export type OfficeState = SchemaType<typeof OfficeState>;

// Si el schema deja de cumplir la forma plana de `types.ts`, falla la compilación.
export type PlayerSatisfiesData = Player extends PlayerData ? true : never;
const _playerSatisfiesData: PlayerSatisfiesData = true;
void _playerSatisfiesData;
