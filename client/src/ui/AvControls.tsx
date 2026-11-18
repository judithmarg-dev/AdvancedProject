import { useEffect, useState } from "react";
import { voice } from "../net/voiceInstance";
import { AV_NOTICE_MS, useAv } from "../store/av";
import { avShortcut } from "./avKeys";
import "./av.css";

/** Aviso breve (permiso denegado, voz no disponible…) que desaparece solo. */
function AvNotice() {
  const notice = useAv((state) => state.notice);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!notice) return;
    setVisible(true);
    const hide = setTimeout(() => setVisible(false), AV_NOTICE_MS);
    return () => clearTimeout(hide);
  }, [notice]);
  if (!notice || !visible) return null;
  return (
    <div className="av-notice" role="status">
      {notice.text}
    </div>
  );
}

/** Botones de micrófono y cámara, abajo al centro, con atajos M y V fuera del chat (spec 005 AC-4..AC-8). */
export function AvControls() {
  const status = useAv((state) => state.status);
  const mic = useAv((state) => state.mic);
  const cam = useAv((state) => state.cam);
  const ready = status === "connected";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = avShortcut(event);
      if (!action) return;
      event.preventDefault();
      void (action === "mic" ? voice.toggleMic() : voice.toggleCam());
    };
    // El navegador solo deja reproducir audio tras un gesto: cualquier clic o tecla lo desbloquea.
    const unlock = () => voice.resumeAudio();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const title = (label: string, on: boolean, key: string) =>
    ready
      ? `${on ? "Apagar" : "Encender"} ${label} (${key})`
      : status === "connecting"
        ? "Conectando la voz…"
        : "Voz no disponible";

  return (
    <>
      <AvNotice />
      <div className="av-controls" aria-label="Micrófono y cámara">
        <button
          type="button"
          className={mic ? "av-button av-button--on" : "av-button"}
          disabled={!ready}
          aria-pressed={mic}
          title={title("micrófono", mic, "M")}
          onClick={() => void voice.toggleMic()}
        >
          <span aria-hidden="true">{mic ? "🎙️" : "🔇"}</span>
          <span className="av-button__label">{mic ? "Micro encendido" : "Micro apagado"}</span>
        </button>
        <button
          type="button"
          className={cam ? "av-button av-button--on" : "av-button"}
          disabled={!ready}
          aria-pressed={cam}
          title={title("cámara", cam, "V")}
          onClick={() => void voice.toggleCam()}
        >
          <span aria-hidden="true">{cam ? "📹" : "🚫"}</span>
          <span className="av-button__label">{cam ? "Cámara encendida" : "Cámara apagada"}</span>
        </button>
      </div>
    </>
  );
}
