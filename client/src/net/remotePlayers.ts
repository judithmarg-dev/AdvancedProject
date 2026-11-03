import { createSnapshotBuffer, type PlayerPose, type SnapshotBuffer } from "./interpolation";

export type { PlayerPose };

/**
 * Posiciones de los demás participantes, fuera de React: la red escribe al llegar cada cambio y la escena
 * lee en cada fotograma sin provocar renders.
 */
export function createRemotePlayers() {
  const buffers = new Map<string, SnapshotBuffer>();
  return {
    track(id: string, time: number, pose: PlayerPose) {
      let buffer = buffers.get(id);
      if (!buffer) buffers.set(id, (buffer = createSnapshotBuffer()));
      buffer.push(time, pose);
    },
    untrack(id: string) {
      buffers.delete(id);
    },
    sample(id: string, now: number): PlayerPose | null {
      return buffers.get(id)?.sample(now) ?? null;
    },
  };
}

export const remotePlayers = createRemotePlayers();
