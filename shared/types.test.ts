import { describe, expect, it } from "vitest";
import { DEFAULT_CLIENT_PORT, DEFAULT_SERVER_PORT, ROOM_NAME } from "./types";

describe("constantes compartidas", () => {
  it("define el nombre de la sala", () => {
    expect(ROOM_NAME).toBe("office");
  });

  it("define los puertos por defecto", () => {
    expect(DEFAULT_SERVER_PORT).toBe(2567);
    expect(DEFAULT_CLIENT_PORT).toBe(5173);
  });
});
