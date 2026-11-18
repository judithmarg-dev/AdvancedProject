/**
 * Reglas del audio/video por proximidad (spec 005). El volumen y los videos visibles son presentación local:
 * cada participante los calcula con las posiciones que ve en pantalla.
 */
import type { AvAccess } from "./types";
import type { Vec2 } from "./world";

export const AV = {
  /** Hasta esta distancia (m) se oye a volumen pleno. */
  fullVolumeDistance: 2,
  /** Desde esta distancia (m) no se oye. */
  silenceDistance: 8,
  /** Distancia máxima (m) a la que se ve el video de otro participante. */
  videoDistance: 8,
  /** Videos ajenos visibles a la vez, además del propio. */
  maxVideos: 4,
  /** Frecuencia mínima de recálculo del volumen (Hz). */
  volumeUpdateHz: 10,
  /** Validez del acceso al canal de audio/video (s). */
  accessTtlSeconds: 4 * 60 * 60,
} as const;

/** Volumen (0–1) con que se oye a alguien a `distance` metros: pleno, caída suave y continua, silencio. */
export function volumeForDistance(distance: number): number {
  if (Number.isNaN(distance)) return 0;
  const { fullVolumeDistance: near, silenceDistance: far } = AV;
  if (distance <= near) return 1;
  if (distance >= far) return 0;
  const t = (distance - near) / (far - near);
  return 1 - t * t * (3 - 2 * t);
}

export const distance2d = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Ids de los participantes cuyo video se muestra: a ≤ 8 m, los más cercanos primero, como mucho 4. */
export function pickVideoPeers(self: Vec2, peers: readonly (Vec2 & { id: string })[]): string[] {
  return peers
    .map((peer) => ({ id: peer.id, d: distance2d(self, peer) }))
    .filter((peer) => peer.d <= AV.videoDistance)
    .sort((a, b) => a.d - b.d)
    .slice(0, AV.maxVideos)
    .map((peer) => peer.id);
}

/** Respuesta del servidor validada; lo que no tenga la forma esperada cuenta como error. */
export function parseAvAccess(raw: unknown): AvAccess {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const { ok, url, token, reason } = raw as Record<string, unknown>;
    if (ok === true && typeof url === "string" && url !== "" && typeof token === "string" && token !== "") {
      return { ok: true, url, token };
    }
    if (ok === false && (reason === "disabled" || reason === "error")) return { ok: false, reason };
  }
  return { ok: false, reason: "error" };
}
