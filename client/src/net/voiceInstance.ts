import { avStore } from "../store/av";
import { createLiveKitRoom } from "./livekitRoom";
import { remotePlayers } from "./remotePlayers";
import { selfPose } from "./selfPose";
import { createVoice, type VoiceSink } from "./voice";

const sink: VoiceSink = {
  reset: () => avStore.getState().reset(),
  connecting: () => avStore.getState().connecting(),
  connected: () => avStore.getState().connected(),
  unavailable: (text, now) => avStore.getState().unavailable(text, now),
  setMic: (on) => avStore.getState().setMic(on),
  setCam: (on) => avStore.getState().setCam(on),
  deviceFailed: (kind, text, now) => avStore.getState().deviceFailed(kind, text, now),
  peers: (peers) => avStore.getState().peers(peers),
  speakers: (ids) => avStore.getState().speakers(ids),
  visibleVideos: (ids) => avStore.getState().visibleVideos(ids),
};

/** Canal de audio/video de la página, con LiveKit, las posiciones de la escena y el store. */
export const voice = createVoice(
  {
    createRoom: createLiveKitRoom,
    selfPose: () => selfPose.current,
    peerPose: (id, now) => remotePlayers.sample(id, now),
    now: () => performance.now(),
    every: (ms, fn) => {
      const handle = window.setInterval(fn, ms);
      return () => window.clearInterval(handle);
    },
    log: (message) => console.log(message),
    error: (message, cause) => console.error(message, cause),
  },
  sink,
);
