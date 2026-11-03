import { useState, type FormEvent } from "react";
import { NAME_MAX_LENGTH, normalizeName } from "@office/shared";
import { enterOffice, type OfficeSession } from "../net/office";
import { SERVER_URL } from "../net/serverUrl";
import { useSession } from "../store/session";

export const NAME_REQUIRED_MESSAGE = "Escribe tu nombre para entrar";

/**
 * Pantalla de entrada sobre la sala atenuada (spec 003 AC-1–AC-4). La validación del nombre aquí es solo de
 * cortesía: el servidor la repite y es quien decide. Tras un fallo se conserva el nombre (AC-17, AC-18).
 */
export function EntryScreen({ onSession }: { onSession(session: OfficeSession): void }) {
  const savedName = useSession((state) => state.name);
  const connecting = useSession((state) => state.phase === "connecting");
  const serverError = useSession((state) => state.error);
  const [name, setName] = useState(savedName);
  const [nameError, setNameError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (connecting) return;
    const valid = normalizeName(name);
    if (valid === null) {
      setNameError(NAME_REQUIRED_MESSAGE);
      return;
    }
    setNameError(null);
    setName(valid);
    const session = await enterOffice(SERVER_URL, valid);
    if (session) onSession(session);
  }

  const message = nameError ?? serverError;

  return (
    <div className="entry">
      <form className="entry__panel" onSubmit={submit} noValidate>
        <h1 className="entry__title">Oficina virtual</h1>
        <label className="entry__label" htmlFor="entry-name">
          Tu nombre
        </label>
        <input
          id="entry-name"
          className="entry__input"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="nickname"
          autoFocus
          disabled={connecting}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(null);
          }}
        />
        <button className="entry__button" type="submit" disabled={connecting}>
          {connecting ? "Entrando…" : "Entrar"}
        </button>
        <p className="entry__message" role="alert" aria-live="polite">
          {message ?? ""}
        </p>
      </form>
    </div>
  );
}
