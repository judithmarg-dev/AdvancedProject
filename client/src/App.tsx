import { useState } from "react";
import type { OfficeSession } from "./net/office";
import { Scene } from "./scene/Scene";
import { useSession } from "./store/session";
import { ChatPanel } from "./ui/ChatPanel";
import { ControlsHint } from "./ui/ControlsHint";
import { EntryScreen } from "./ui/EntryScreen";

export function App() {
  const phase = useSession((state) => state.phase);
  const [session, setSession] = useState<OfficeSession | null>(null);
  const inRoom = phase === "inRoom";

  return (
    <>
      <Scene session={inRoom ? session : null} dimmed={!inRoom} />
      {/* El aviso de controles aparece al entrar a la sala, no al cargar la página (spec 003, impacto en 002 AC-17). */}
      {inRoom ? <ControlsHint /> : <EntryScreen onSession={setSession} />}
      {/* El chat solo existe dentro de la sala (spec 004 AC-1). */}
      {inRoom && <ChatPanel session={session} />}
    </>
  );
}
