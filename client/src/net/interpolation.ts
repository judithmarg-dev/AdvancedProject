import { INTERPOLATION_DELAY_MS } from "@office/shared";
import { shortestAngleDelta } from "../scene/movement";

/** Posición y orientación de un avatar en un instante. */
export type PlayerPose = { x: number; z: number; rotY: number };

type Snapshot = { time: number; pose: PlayerPose };

export interface SnapshotBuffer {
  push(time: number, pose: PlayerPose): void;
  /** Pose a dibujar en `now`: interpolada a `now - delay`, sin extrapolar más allá de la última. */
  sample(now: number): PlayerPose | null;
  size(): number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Instantáneas de otro participante, en el orden en que llegan. Se dibujan con un retraso fijo para que
 * siempre haya una instantánea por delante entre la que interpolar (spec 003 AC-9).
 */
export function createSnapshotBuffer(delayMs = INTERPOLATION_DELAY_MS): SnapshotBuffer {
  const snapshots: Snapshot[] = [];

  return {
    push(time, pose) {
      const last = snapshots[snapshots.length - 1];
      if (last && time <= last.time) {
        last.pose = pose;
        return;
      }
      snapshots.push({ time, pose });
    },

    sample(now) {
      const first = snapshots[0];
      if (!first) return null;
      const renderTime = now - delayMs;

      // Las instantáneas anteriores a la que precede a `renderTime` ya no se necesitan.
      while (snapshots.length > 2 && snapshots[1]!.time <= renderTime) snapshots.shift();

      const a = snapshots[0]!;
      if (renderTime <= a.time) return { ...a.pose };

      const b = snapshots[1];
      if (!b || renderTime >= b.time) return { ...(b ?? a).pose };

      const t = (renderTime - a.time) / (b.time - a.time);
      return {
        x: lerp(a.pose.x, b.pose.x, t),
        z: lerp(a.pose.z, b.pose.z, t),
        rotY: a.pose.rotY + shortestAngleDelta(a.pose.rotY, b.pose.rotY) * t,
      };
    },

    size: () => snapshots.length,
  };
}
