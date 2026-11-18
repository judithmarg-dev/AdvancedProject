import { useEffect, useRef } from "react";
import { voice } from "../net/voiceInstance";
import { useAv } from "../store/av";
import { useSession } from "../store/session";

/** Un video: se pinta con la pista de LiveKit al montar y se suelta al desmontar. */
function VideoTile({ identity, name, mirrored }: { identity: string | null; name: string; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    return el ? voice.attachVideo(identity, el) : undefined;
  }, [identity]);
  return (
    <figure className="video-tile">
      <video ref={ref} autoPlay playsInline muted className={mirrored ? "video-tile__video--mirrored" : undefined} />
      <figcaption>{name}</figcaption>
    </figure>
  );
}

/** Panel arriba a la derecha: la propia cámara y la de los cercanos (≤ 8 m, máx. 4) (spec 005 AC-7, AC-14). */
export function VideoPanel() {
  const cam = useAv((state) => state.cam);
  const videos = useAv((state) => state.videos);
  const remotes = useSession((state) => state.remotes);
  const selfName = useSession((state) => state.self?.name ?? "");
  const shown = videos.filter((id) => id in remotes);
  if (!cam && shown.length === 0) return null;

  return (
    <div className="video-panel" aria-label="Video">
      {cam && <VideoTile identity={null} name={`${selfName} (tú)`} mirrored />}
      {shown.map((id) => (
        <VideoTile key={id} identity={id} name={remotes[id]?.name ?? ""} />
      ))}
    </div>
  );
}
