import { Room, RoomEvent, Track, type Participant, type RemoteTrack } from "livekit-client";
import type { VoicePeer, VoiceRoom, VoiceRoomEvents } from "./voice";

/** Sala de LiveKit real detrás de la interfaz que usa `net/voice.ts`. */
export function createLiveKitRoom(): VoiceRoom {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  /** Elementos de audio de los demás; la voz propia nunca se reproduce (spec 005, regla «voz propia»). */
  const audioElements = new Map<string, HTMLMediaElement>();
  const audioKey = (track: RemoteTrack) => track.sid ?? String(track.mediaStreamTrack.id);

  return {
    async connect(url, token) {
      await room.connect(url, token, { autoSubscribe: true });
    },
    async disconnect() {
      await room.disconnect(true);
      for (const el of audioElements.values()) el.remove();
      audioElements.clear();
    },
    setMicrophoneEnabled: (on) => room.localParticipant.setMicrophoneEnabled(on),
    setCameraEnabled: (on) => room.localParticipant.setCameraEnabled(on),
    startAudio: () => room.startAudio(),
    participants(): VoicePeer[] {
      return [...room.remoteParticipants.values()].map((p) => ({
        identity: p.identity,
        micOn: p.isMicrophoneEnabled,
        camOn: p.isCameraEnabled && !!p.getTrackPublication(Track.Source.Camera)?.videoTrack,
        setVolume: (volume: number) => p.setVolume(volume, Track.Source.Microphone),
      }));
    },
    listen(events: VoiceRoomEvents) {
      const changed = () => events.changed();
      room
        .on(RoomEvent.ParticipantConnected, changed)
        .on(RoomEvent.ParticipantDisconnected, changed)
        .on(RoomEvent.TrackPublished, changed)
        .on(RoomEvent.TrackUnpublished, changed)
        .on(RoomEvent.TrackMuted, changed)
        .on(RoomEvent.TrackUnmuted, changed)
        .on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.dataset.voice = "remote";
            document.body.appendChild(el);
            audioElements.set(audioKey(track), el);
          }
          changed();
        })
        .on(RoomEvent.TrackUnsubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const key = audioKey(track);
            for (const el of track.detach()) el.remove();
            audioElements.get(key)?.remove();
            audioElements.delete(key);
          }
          changed();
        })
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => events.speakers(speakers.map((s) => s.identity)))
        .on(RoomEvent.Disconnected, () => events.disconnected());
    },
    attachVideo(identity, el) {
      const participant = identity === null ? room.localParticipant : room.remoteParticipants.get(identity);
      const track = participant?.getTrackPublication(Track.Source.Camera)?.videoTrack;
      if (!track) return () => {};
      track.attach(el);
      return () => {
        track.detach(el);
      };
    },
  };
}
