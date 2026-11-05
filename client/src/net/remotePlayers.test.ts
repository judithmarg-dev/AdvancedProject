import { describe, expect, it } from "vitest";
import { INTERPOLATION_DELAY_MS } from "@office/shared";
import { createRemotePlayers } from "./remotePlayers";

describe("remotePlayers.positions", () => {
  it("devuelve la posición que se ve de cada participante seguido, para frenar contra ellos (AC-22)", () => {
    const remotes = createRemotePlayers();
    remotes.track("a", 0, { x: 1, z: 2, rotY: 0 });
    remotes.track("b", 0, { x: -3, z: 0.5, rotY: 1 });

    expect(remotes.positions(INTERPOLATION_DELAY_MS + 10)).toEqual([
      { x: 1, z: 2 },
      { x: -3, z: 0.5 },
    ]);
  });

  it("deja de incluir a quien se deja de seguir", () => {
    const remotes = createRemotePlayers();
    remotes.track("a", 0, { x: 1, z: 2, rotY: 0 });
    remotes.untrack("a");
    expect(remotes.positions(1000)).toEqual([]);
  });
});
