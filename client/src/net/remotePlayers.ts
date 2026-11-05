import type { Vec2 } from "@office/shared";
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
    /** Dónde se ve ahora a cada participante: el avatar propio choca contra esto (spec 003 AC-22). */
    positions(now: number): Vec2[] {
      const result: Vec2[] = [];
      for (const buffer of buffers.values()) {
        const pose = buffer.sample(now);
        if (pose) result.push({ x: pose.x, z: pose.z });
      }
      return result;
    },
  };
}

export const remotePlayers = createRemotePlayers();
