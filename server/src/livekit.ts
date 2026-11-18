import { AccessToken } from "livekit-server-sdk";
import { AV, ROOM_NAME, type AvAccess } from "@office/shared";
import type { LiveKitConfig } from "./config";

export type AvGrant = Extract<AvAccess, { ok: true }>;

/** Emite accesos al canal de audio/video; el servidor de la oficina fija identidad y nombre (spec 005 AC-2). */
export interface AccessIssuer {
  issue(identity: string, name: string): Promise<Omit<AvGrant, "ok">>;
}

export function createAccessIssuer(config: LiveKitConfig): AccessIssuer {
  return {
    async issue(identity, name) {
      const token = new AccessToken(config.apiKey, config.apiSecret, { identity, name, ttl: AV.accessTtlSeconds });
      // Solo la sala de la oficina, sin permisos de administración ni de crear otras salas.
      token.addGrant({ roomJoin: true, room: ROOM_NAME, canPublish: true, canSubscribe: true, canPublishData: false });
      return { url: config.url, token: await token.toJwt() };
    },
  };
}
