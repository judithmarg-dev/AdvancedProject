# Plan · 003 Multijugador: presencia y movimiento compartidos

## Enfoque
El servidor pasa a tener estado: una sala única con un mapa de participantes (`id, name, x, z, rotY, color`)
que él crea, valida y borra. El cliente sigue moviendo su avatar en local como en la spec 002 (respuesta
inmediata, AC-12) y envía su posición a 12 Hz solo cuando cambia; el servidor la acepta con las mismas
colisiones de `shared/world.ts` o la rechaza y devuelve la última válida. Los avatares ajenos se dibujan
a partir de un búfer de instantáneas interpolado con ~120 ms de retraso. Toda la lógica decidible sin
navegador (nombre, validación de movimiento, mensajes, colores, ritmo de envío, interpolación, transiciones
de la pantalla de entrada) se aísla en funciones puras con test; la sala se prueba con `@colyseus/testing`.

## Cambios por capa

### shared
- `shared/types.ts` (se amplía, sigue siendo el punto de entrada):
  - Constantes: `MAX_PLAYERS = 20`, `NAME_MAX_LENGTH = 20`, `SEND_RATE_HZ = 12`,
    `INTERPOLATION_DELAY_MS = 120`, `MOVE_TOLERANCE = { factor: 1.5, slack: 0.3 }` (m),
    `MAX_MOVE_GAP_MS = 1000` (tope de tiempo que se concede entre dos envíos).
  - `MSG = { move: "move", correction: "correction" } as const`.
  - `type MoveMessage = { x: number; z: number; rotY: number }`, `type CorrectionMessage = { x: number; z: number }`.
  - `type JoinOptions = { name: string }`.
  - `JOIN_ERROR = { invalidName: 4001, roomFull: 4002 } as const`.
  - `interface PlayerData { id; name; x; z; rotY; color }`: forma plana que implementa el schema.
- `shared/players.ts` (nuevo, reexportado): `normalizeName(raw: unknown): string | null` (recorta, 1–20
  caracteres), `AVATAR_COLORS` (20 pasteles; el verde de la spec 002 es uno más) y
  `pickColor(used: Iterable<string>): string` (primer color libre).
- `shared/movementRules.ts` (nuevo, reexportado): `parseMoveMessage(raw: unknown): MoveMessage | null`
  (objeto con tres números finitos) y `validateMove(prev: Vec2, next: Vec2, elapsedMs): boolean`:
  rechaza si queda fuera de la sala, si `resolveMovement(prev, next - prev)` no llega a `next` (cruza pared
  o mueble) o si la distancia supera `MOVE_SPEED · min(elapsed, MAX_MOVE_GAP_MS) · factor + slack`.
- `shared/schema.ts` (nuevo, subruta `@office/shared/schema`): `Player` y `OfficeState`
  (`players: MapSchema<Player>`) con `schema()` de `@colyseus/schema`. Va en subruta para que el cliente
  lo importe solo como tipo (`import type`) y no arrastre código del servidor.
- `shared/package.json`: dependencia `@colyseus/schema` y `exports["./schema"]`.

### server
- `src/rooms/OfficeRoom.ts` (`Room<{ state: OfficeState }>`):
  - `onAuth(client, options)`: `normalizeName(options?.name)`; si es `null`, `ServerError(JOIN_ERROR.invalidName)`.
  - `onJoin`: si ya hay `MAX_PLAYERS`, `ServerError(JOIN_ERROR.roomFull)` (comprobado aquí, que es síncrono,
    para que dos entradas simultáneas no superen el límite, AC-19/AC-20). Crea `Player` en `SPAWN`, `rotY = 0`,
    `color = pickColor(colores presentes)`; guarda en un `Map` privado la hora del último movimiento aceptado.
    Log `[OfficeRoom] Entra <name> (<sessionId>)`.
  - `onMessage(MSG.move)`: `parseMoveMessage` → si `null`, `console.warn` y descarta (AC-14); `validateMove`
    → si pasa, actualiza `x, z, rotY` y la hora; si no, `client.send(MSG.correction, { x, z })` con la
    última válida (AC-13). El giro se acepta siempre que sea finito.
  - `onLeave`: borra el jugador y su hora; log `[OfficeRoom] Sale <name> (<sessionId>)` (AC-15).
  - Sin `maxClients`: con `joinOrCreate`, un `maxClients` lleno haría que el matchmaker creara una segunda
    sala; el límite lo aplica `onJoin`.
- `src/server.ts`: `WebSocketTransport({ pingInterval: 1000, pingMaxRetries: 1 })` para detectar en ~2 s
  una conexión caída sin cierre limpio (AC-15). Cerrar o recargar la pestaña ya cierra el socket al instante.

### client
- `src/store/session.ts` (zustand): `phase: "entry" | "connecting" | "inRoom"`, `name`, `error: string | null`,
  `selfId`, `remotes: Record<id, { name; color }>` (solo altas/bajas: provoca render; las posiciones no).
  Acciones puras `startJoin`, `joined`, `joinFailed(message)`, `connectionLost()`, `playerAdded/Removed`.
- `src/net/office.ts` (sustituye a `connect.ts`, mismo patrón de dependencias inyectables):
  `joinOffice(url, name, deps)` → `{ sessionId, sendMove, leave }`. Se suscribe con `getStateCallbacks`
  a `players.onAdd/onRemove/onChange`; reenvía cambios a `remotePlayers`; escucha `MSG.correction`;
  `onLeave` → `connectionLost`. Traduce errores: `roomFull` → «La sala está completa», `invalidName` →
  «El nombre no es válido», resto → «No se pudo conectar con el servidor». Logs `[net]` de llegada y salida
  de otros con su nombre (AC-5, AC-15).
- `src/net/interpolation.ts`: `createSnapshotBuffer()` con `push(t, x, z, rotY)` y `sample(t)` → posición
  interpolada a `t - INTERPOLATION_DELAY_MS` (giro por el camino corto con `shortestAngleDelta`), sin
  extrapolar: si faltan datos se queda en la última (AC-9, AC-11).
- `src/net/remotePlayers.ts`: registro mutable `Map<id, SnapshotBuffer>` fuera de React, leído en `useFrame`.
- `src/net/sendPolicy.ts`: `createSendPolicy(rateHz)` → `shouldSend(now, state)`: como mucho cada
  `1000/12` ms, solo si posición o giro cambiaron más que un umbral, y un último envío exacto al pararse (AC-10).
- `src/scene/usePlayerController.ts`: recibe `enabled` (sin teclado ni cámara de seguimiento fuera de la sala,
  AC-1), llama a `sendMove` según `sendPolicy` y aplica correcciones al instante (posición y velocidad a 0, AC-13).
- `src/scene/Avatar.tsx`: recibe `color` y `name`; el cuerpo usa `color` (el tono oscuro de los pies se deriva).
  Se separa la parte visual (`AvatarBody`) para reutilizarla en `RemoteAvatar.tsx`, que lee su búfer en
  `useFrame` y deriva la velocidad de la posición interpolada para respiración/balanceo (AC-11).
- `src/scene/NameLabel.tsx`: `Sprite` con `CanvasTexture` (siempre de frente a la cámara, AC-7), encima del avatar.
- `src/scene/Scene.tsx`: avatar propio solo en `inRoom`; un `RemoteAvatar` por id de `remotes`.
- `src/ui/EntryScreen.tsx`: panel sobre la sala atenuada (filtro CSS en el lienzo), campo con `maxLength=20`,
  Intro o botón, aviso de nombre obligatorio y de error de conexión; conserva el nombre (AC-1–4, AC-17–19).
- `src/App.tsx`: `Scene` siempre; `EntryScreen` fuera de `inRoom`; `ControlsHint` solo al entrar (impacto en 002 AC-17).
- `src/main.tsx`: deja de conectar al cargar; la conexión la inicia la pantalla de entrada.
- `src/scene/palette.ts`: `avatar`/`avatarDark` dejan de usarse para el cuerpo (el color viene del servidor).

### Cambios de la validación manual (2026-11-03)
- **AC-9 (salto al andar):** el balanceo usaba `sin(tiempo × velocidad)`; en los remotos la velocidad estimada oscila (las instantáneas llegan cada 50 o 100 ms por los parches a 20 Hz) y la fase salta. Se pasa a una fase acumulada por distancia (`advanceWalkPhase`) y a un estimador de movimiento remoto suavizado (`remoteMotion.ts`), sin tocar la red.
- **AC-21 (grano):** textura de ruido en escala de grises generada en código (`DataTexture`, sin dependencias) usada como `map` y `roughnessMap` en los materiales del avatar.

## Cambio 2026-11-04 · Colisiones entre avatares (AC-22–AC-25, T34–T39)
- **shared:** `shared/avatarCollision.ts` (reexportado): `AVATAR_GAP` (2 radios), `AVATAR_OVERLAP_TOLERANCE`
  (1 radio), `separateFromAvatars` (para al contacto y desliza; si ya se solapan, no se acercan más),
  `moveAvatar` (`resolveMovement` + avatares, recortando otra vez contra los muebles), `findSpawn` (SPAWN o el
  hueco libre más cercano de una rejilla de 0,25 m) y `overlapsAvatar` (distancia mínima del trazado < margen
  y acercándose).
- **server:** `OfficeRoom.onJoin` coloca con `findSpawn`; `handleMove` rechaza también con `overlapsAvatar`
  (misma corrección que AC-13).
- **client:** `joined` lleva `spawn` (posición que da el servidor) y el avatar propio empieza ahí;
  `usePlayerController` usa `moveAvatar` contra `remotePlayers.positions(now)` (lo que se ve en pantalla).
- **Constitución:** II se mantiene (el servidor coloca y valida; el cliente solo predice); III, funciones y
  constantes en `shared/`, sin tipos de red nuevos; V, sin dependencias nuevas.

## Contratos de red
| Mensaje / endpoint | Dirección | Payload (tipo en `shared/`) | Respuestas / errores |
|---|---|---|---|
| `joinOrCreate(ROOM_NAME, opts)` | cliente → servidor | `JoinOptions` | Rechazo `JOIN_ERROR.invalidName` (nombre vacío/largo), `JOIN_ERROR.roomFull` (20 presentes). |
| Estado de la sala | servidor → clientes | `OfficeState { players: Map<id, Player> }` (`PlayerData`) | Parches automáticos de Colyseus al cambiar. |
| `MSG.move` | cliente → servidor | `MoveMessage { x, z, rotY }` | Mal formado: se descarta y se registra. Inválido: `MSG.correction`. |
| `MSG.correction` | servidor → emisor | `CorrectionMessage { x, z }` | Última posición válida; el cliente la aplica sin transición. |

## Verificación de constitución
| Artículo | ¿Cumple? | Justificación |
|---|---|---|
| I | Sí | Schema, mensajes, zustand y sprites solo aparecen aquí; la spec habla de nombre, color y movimiento. |
| II | Sí | El servidor asigna id, color y posición inicial, valida cada movimiento con `shared/world.ts` y corrige. El cliente solo envía intención; la validación del nombre en el cliente es solo de cortesía, el servidor la repite. |
| III | Sí | Mensajes, opciones, códigos de error y el schema viven en `shared/`; el cliente usa `import type` del schema. Payloads entrantes tipados como `unknown` y parseados; sin `any`. |
| IV | Sí | Cada función pura y cada comportamiento de la sala llevan su test fallido antes de implementarse (ver tareas). |
| V | Sí | `@colyseus/schema` (shared) y `zustand` (client) anotadas aquí y en `PLAN.md` > Decisiones. |
| VI | Sí | Sin variables de entorno nuevas; `.env.example` no cambia. |
| VII | Sí | Solo presencia y movimiento; chat y audio quedan para 004/005. La Fase 1 está cerrada. |

## Decisiones
- **Dependencias nuevas** (también en `PLAN.md` > Decisiones):
  - `@colyseus/schema` ^5 en `shared/`: es la dependencia par de `@colyseus/core` y `@colyseus/sdk` y ya está
    en `node_modules`; declararla evita depender de una instalación transitiva. Va en `shared/` porque el schema
    es un tipo de red (art. III).
  - `zustand` ^5 en `client/` (previsto en la tabla de stack; diferido desde la spec 002): estado de la sesión
    y de la lista de participantes, que sí provoca render. Posiciones ajenas fuera de React por rendimiento.
  - `npm install` debe ejecutarlo la humana desde una terminal de Windows (decisión de la spec 001).
- **Schema en `shared/` y no en `server/`:** el cliente obtiene el tipo del estado sin duplicarlo. Descartado:
  interfaz en `shared/` + schema en `server/` (dos definiciones que pueden divergir).
- **Límite de 20 en `onJoin`, no con `maxClients`:** con `joinOrCreate`, una sala llena llevaría al matchmaker a
  crear otra y se partiría la oficina. Descartado: crear la sala al arrancar y usar `join` (el error de «no hay
  sala» no distingue «llena» de «caída»).
- **Validación por diferencia con la última posición aceptada** (no simulación en el servidor): basta con
  posiciones y una tolerancia de velocidad. Descartado: enviar teclas y simular en el servidor (añade latencia al
  propio movimiento y contradice AC-12).
- **Interpolación con retraso fijo de 120 ms y sin extrapolación:** a 12 Hz hay siempre ~1,4 instantáneas por
  delante; si se pierde alguna, el avatar espera en lugar de adivinar. Descartado: extrapolación (temblores al frenar).
- **Etiquetas con `Sprite` + `CanvasTexture`:** de frente a la cámara sin dependencias. Descartado: `drei` `<Html>`
  / `<Text>` (dependencia retirada en la 002; se reevalúa en la Fase 5).
- **Sin reconexión:** `onLeave` siempre devuelve a la pantalla de entrada (AC-18); no se usa `allowReconnection`.
- **Envío solo al cambiar:** reduce tráfico con participantes quietos y hace verificable AC-10.

## Riesgos
- **Detección de conexión caída sin cierre (AC-15):** depende del ping; con 1 s × 1 reintento ronda 2 s. En la
  validación manual se prueba cerrar y recargar (cierre limpio); el corte sin cierre se prueba en integración si
  el cliente de pruebas lo permite, si no se anota como manual.
- **API de Colyseus 0.18 / schema 5:** `schema()` y `getStateCallbacks` cambiaron respecto a versiones previas; se
  confirman con el primer test de integración (T6) antes de construir encima.
- **Tolerancia de velocidad:** un valor corto rechaza movimientos legítimos con red irregular (correcciones
  visibles). Se ajusta en la validación manual con dos pestañas.

## Estrategia de pruebas
| AC | Tipo | Archivo / razón |
|---|---|---|
| AC-1 | unit + manual | `client/src/store/session.test.ts` (fase inicial `entry`, sin conexión); aspecto atenuado en validación. |
| AC-2 | unit | `shared/players.test.ts` (`normalizeName` vacío/espacios → `null`); `server/.../OfficeRoom.test.ts` (rechazo `invalidName`). |
| AC-3 | unit + integración | `shared/players.test.ts` (recorte y longitud 20); `OfficeRoom.test.ts` (nombre de 21 → rechazo, recortado al guardar). |
| AC-4 | integración + manual | `OfficeRoom.test.ts` (jugador en `SPAWN`, color asignado, nombre); `session.test.ts` (`joined` → `inRoom`); escena manual. |
| AC-5 | integración + unit + manual | `OfficeRoom.test.ts` (quien entra después recibe el estado con los presentes y su posición); `client/src/net/office.test.ts` (log de llegada); dos pestañas. |
| AC-6 | unit + integración | `shared/players.test.ts` (`pickColor` no repite, 20 colores); `OfficeRoom.test.ts` (colores distintos entre presentes, reutiliza el de quien sale). |
| AC-7 | manual | Sprite de frente a la cámara: visual, no automatizable sin navegador. |
| AC-8 | integración | `OfficeRoom.test.ts` (dos clientes con el mismo nombre → dos jugadores distintos). |
| AC-9 | unit + manual | `client/src/net/interpolation.test.ts` (interpola entre instantáneas, giro corto, sin saltos); `remoteMotion.test.ts`, `animation.test.ts` (fase continua); fluidez en dos pestañas. |
| AC-10 | unit + manual | `client/src/net/sendPolicy.test.ts` (≤ 12 Hz, nada quieto, último envío al parar); pestaña Red/WS de DevTools. |
| AC-11 | unit + manual | `interpolation.test.ts` (sin datos nuevos se queda quieto, no deriva); respiración en validación. |
| AC-12 | manual | El movimiento local no espera al servidor (mismo bucle de la spec 002); percepción en validación. |
| AC-13 | unit + integración + manual | `shared/movementRules.test.ts` (pared, mueble, fuera de sala, demasiado rápido); `OfficeRoom.test.ts` (estado sin cambiar + `correction`); salto visible en validación. |
| AC-14 | unit + integración | `movementRules.test.ts` (`parseMoveMessage` con faltantes, strings, `NaN`, `Infinity`); `OfficeRoom.test.ts` (descarta, registra, la sala sigue). |
| AC-15 | integración + unit + manual | `OfficeRoom.test.ts` (salir borra el jugador y registra el nombre); `office.test.ts` (log de salida); cierre/recarga de pestaña. |
| AC-16 | integración | `OfficeRoom.test.ts` (salir y volver → un solo jugador, en `SPAWN`). |
| AC-17 | unit + manual | `office.test.ts` (error de red → mensaje); `session.test.ts` (`joinFailed` vuelve a `entry` con nombre y aviso); servidor parado. |
| AC-18 | unit + manual | `office.test.ts` (`onLeave` → `connectionLost`); `session.test.ts` (vacía `remotes`, vuelve a `entry` con aviso); parar el servidor con la sala abierta. |
| AC-19 | integración + unit | `OfficeRoom.test.ts` (el 21.º recibe `roomFull`, los 20 siguen); `office.test.ts` (traducción del error). |
| AC-20 | integración | `OfficeRoom.test.ts` (dos `connectTo` en paralelo → dos jugadores, colores distintos, cada uno ve al otro una vez). |
| AC-21 | unit + manual | `client/src/scene/grain.test.ts` (ruido determinista, claro y variado); aspecto granulado solo en avatares, a ojo en la validación manual. |
