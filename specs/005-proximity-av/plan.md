# Plan · 005 Audio y video por proximidad

## Enfoque
El servidor de la oficina emite el acceso a LiveKit a petición de un participante que ya está en la sala
(mensaje de sala, no HTTP abierto), con identidad = `sessionId` y nombre = su nombre. El cliente se une a la
sala LiveKit tras entrar, publica micrófono/cámara solo cuando el participante los enciende y ajusta cada
10 Hz el volumen de cada participante remoto según la distancia que ve en pantalla. La curva de volumen y la
selección de videos son funciones puras en `shared/` con test unitario; la integración con LiveKit vive tras
una interfaz inyectable (como `net/office.ts`) para probarla sin servidor de medios.

## Cambios por capa
### shared
- `av.ts`: constantes `AV` (2 m, 8 m, 8 m de video, máx. 4 videos, 10 Hz, TTL del acceso), `volumeForDistance(d)`
  (100 % ≤ 2 m, interpolación suave hasta 0 % a 8 m), `pickVideoPeers(self, peers)` (más cercanos ≤ 8 m, máx. 4),
  `parseAvGrant` (validación del payload en el cliente).
- `types.ts`: `MSG.avAccess` (C→S petición sin payload; S→C `AvAccess`), tipo `AvAccess =
  { ok: true; url: string; token: string } | { ok: false; reason: "disabled" | "error" }`.

### server
- `config.ts`: `getLiveKitConfig(env)` → `{ url, apiKey, apiSecret } | null` (null si falta alguna; sin registrar secretos).
- `livekit.ts`: `createAccessIssuer(config)` → `issue(identity, name)` con `AccessToken` (sala `office`, publicar y
  suscribirse, TTL 4 h).
- `OfficeRoom`: handler `MSG.avAccess` solo para clientes con `Player` en el estado; responde `AvAccess`.
  El emisor se inyecta por opciones de la sala (`onCreate(options)`), así el test no necesita claves reales.
- `server.ts` / `index.ts`: lee la config; si falta, aviso en consola «voz desactivada» (AC-18).

### client
- `net/selfPose.ts`: pose propia fuera de React (la escribe `usePlayerController` en cada fotograma).
- `net/voice.ts`: `joinVoice(access, deps, sink)` con interfaz mínima de la sala LiveKit; conmutar mic/cámara,
  eventos de participantes, pistas, hablantes, desconexión; bucle de proximidad a 10 Hz que llama a `setVolume`.
  Implementación por defecto con `livekit-client`.
- `store/av.ts` (zustand): estado `off | connecting | connected | unavailable`, mic/cámara propios, aviso,
  `speaking` y `micOn` por participante, pistas de video por participante y lista visible.
- `net/office.ts`: tras entrar pide `MSG.avAccess` y entrega la respuesta al sink; al salir/perder conexión
  desconecta la voz (AC-16).
- `ui/AvControls.tsx` (abajo al centro) y `ui/VideoPanel.tsx` (arriba a la derecha); atajos M/V con el mismo
  filtro de campos de texto que el chat (`scene/input.ts`).
- `scene/VoiceIndicator.tsx`: icono junto a la etiqueta (habla / micrófono apagado).

## Contratos de red
| Mensaje / endpoint | Dirección | Payload (tipo en `shared/`) | Respuestas / errores |
|---|---|---|---|
| `avAccess` | C→S | sin payload | Ignorado si el emisor no está en la sala (AC-2) |
| `avAccess` | S→C | `AvAccess` | `{ok:false, reason:"disabled"}` sin config; `{ok:false, reason:"error"}` si falla la firma |
| LiveKit (externo) | C↔LiveKit | token JWT emitido por el servidor | conexión rechazada → `unavailable` (AC-3) |

## Verificación de constitución
| Artículo | ¿Cumple? | Justificación |
|---|---|---|
| I | Sí | La spec no nombra tecnologías salvo «servicio de audio/video». |
| II | Sí | El acceso lo emite el servidor con identidad fijada por él; el cliente no elige identidad ni sala. El volumen es solo presentación local. |
| III | Sí | `AvAccess`, `MSG.avAccess` y constantes en `shared/`; payloads validados sin `any`. |
| IV | Sí | Tareas con test primero para lógica pura, sala y adaptador de voz. |
| V | Sí | `livekit-server-sdk` (server) y `livekit-client` (client) anotadas en Decisiones. |
| VI | Sí | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` en `.env`; `.env.example` con los valores públicos del modo dev de LiveKit. |
| VII | Sí | Solo Fase 4. |

## Decisiones
- Acceso por mensaje de sala en lugar de endpoint HTTP: así solo lo obtiene quien está dentro (AC-2) sin
  inventar autenticación; el servidor ya conoce `sessionId` y nombre. Descartado HTTP con `sessionId` en la
  petición (cualquiera podría pedirlo con un id ajeno).
- La URL de LiveKit viaja en la respuesta: el cliente no necesita variable `VITE_*` adicional.
- Volumen con `RemoteParticipant.setVolume` (sin Web Audio propio ni estéreo, fuera de alcance).
- Suscripción automática a todas las pistas (≤ 20 participantes); el filtro de proximidad del video es de presentación.
- Dependencias: `livekit-server-sdk` 2.19.2 (server), `livekit-client` 2.23.0 (client); versiones con más de dos
  semanas publicadas.

## Estrategia de pruebas
| AC | Tipo | Archivo |
|---|---|---|
| AC-1 | unit + manual | `client/src/net/office.test.ts`, `client/src/net/voice.test.ts`; manual con LiveKit real |
| AC-2 | integración | `server/src/rooms/OfficeRoom.test.ts`, `server/src/livekit.test.ts` |
| AC-3 | unit + integración + manual | `voice.test.ts`, `store/av.test.ts`, `OfficeRoom.test.ts` (disabled) |
| AC-4 | unit + manual | `store/av.test.ts`; botones: manual (DOM) |
| AC-5 | unit + manual | `voice.test.ts`; audio real: manual |
| AC-6 | unit + manual | `voice.test.ts` (rechazo de permisos) ; permiso real del navegador: manual |
| AC-7 | unit + manual | `voice.test.ts`, `store/av.test.ts`; video real: manual |
| AC-8 | unit + manual | `client/src/ui/avKeys.test.ts` |
| AC-9..AC-12 | unit + manual | `shared/av.test.ts` (curva), `voice.test.ts` (bucle de volumen por participante); audio real: manual |
| AC-13 | unit + manual | `store/av.test.ts` (hablantes, mic); icono en escena: manual |
| AC-14 | unit + manual | `shared/av.test.ts` (`pickVideoPeers`), `voice.test.ts`; manual |
| AC-15 | unit + manual | `voice.test.ts`, `store/av.test.ts` |
| AC-16 | unit + manual | `office.test.ts` (desconecta voz al perder conexión) |
| AC-17 | unit + manual | `voice.test.ts` (desconexión solo de medios) |
| AC-18 | unit | `server/src/config.test.ts`, `server/src/server.test.ts` |
