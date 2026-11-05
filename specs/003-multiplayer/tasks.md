# Tareas · 003 Multijugador: presencia y movimiento compartidos

Orden: shared → server → client. Primero el test que falla, luego la implementación.

### Preparación
- [x] T1 · Dependencias: añadir `@colyseus/schema` (shared) y `zustand` (client) a los `package.json`; la humana ejecuta `npm install` desde Windows. Anotar en `PLAN.md` > Decisiones.

### shared
- [x] T2 · (AC-2, AC-3, AC-6) Test: `shared/players.test.ts` — `normalizeName` (vacío, espacios, recorte, 20/21 caracteres, no string) y `pickColor` (20 colores distintos, primer libre, reutiliza liberados).
- [x] T3 · (AC-2, AC-3, AC-6) Implementar `shared/players.ts` y constantes `NAME_MAX_LENGTH`, `MAX_PLAYERS`.
- [x] T4 · (AC-13, AC-14) Test: `shared/movementRules.test.ts` — `parseMoveMessage` (válido, faltantes, tipos, `NaN`/`Infinity`) y `validateMove` (paso normal, pared, mueble, fuera de sala, demasiado rápido, tolerancia con huecos largos).
- [x] T5 · (AC-13, AC-14) Implementar `shared/movementRules.ts`, `MSG`, `MoveMessage`, `CorrectionMessage`, `JoinOptions`, `JOIN_ERROR`, `SEND_RATE_HZ`, `INTERPOLATION_DELAY_MS`, `MOVE_TOLERANCE`, `PlayerData` en `shared/types.ts`; `shared/schema.ts` con `Player` y `OfficeState`, exportado en `@office/shared/schema`.

### server
- [x] T6 · (AC-2, AC-3, AC-4, AC-8) Test de integración: entrar con nombre crea jugador en `SPAWN` con color y nombre recortado; nombre vacío o de 21 → `invalidName`; dos nombres iguales → dos jugadores.
- [x] T7 · (AC-2, AC-3, AC-4, AC-8) Implementar `onAuth`/`onJoin` y el estado en `OfficeRoom`.
- [x] T8 · (AC-5, AC-6, AC-19, AC-20) Test de integración: quien entra después ve a los presentes con su posición; colores distintos; 21.º → `roomFull` sin afectar a los demás; dos entradas en paralelo.
- [x] T9 · (AC-5, AC-6, AC-19, AC-20) Implementar límite de capacidad en `onJoin` y asignación de color.
- [x] T10 · (AC-13, AC-14) Test de integración: `move` válido actualiza el estado; inválido no lo cambia y envía `correction` con la última válida; mal formado se descarta, se registra y la sala sigue.
- [x] T11 · (AC-13, AC-14) Implementar `onMessage(MSG.move)` con `parseMoveMessage`/`validateMove`.
- [x] T12 · (AC-15, AC-16) Test de integración: salir borra el jugador y registra su nombre; salir y volver → un solo jugador en `SPAWN`.
- [x] T13 · (AC-15, AC-16) Implementar `onLeave` y el ping del transporte (1 s × 1 reintento).

### client
- [x] T14 · (AC-1, AC-4, AC-17, AC-18) Test: `client/src/store/session.test.ts` — fase inicial `entry`; `startJoin` → `connecting`; `joined` → `inRoom`; `joinFailed` y `connectionLost` → `entry` con aviso, nombre conservado y `remotes` vacío.
- [x] T15 · (AC-1, AC-4, AC-17, AC-18) Implementar `client/src/store/session.ts` (zustand).
- [x] T16 · (AC-5, AC-15, AC-17, AC-18, AC-19) Test: `client/src/net/office.test.ts` — se une con el nombre; altas/bajas de otros al store y a la consola (ignorando el propio); errores traducidos; `onLeave` → `connectionLost`; `correction` llega al callback.
- [x] T17 · (AC-5, AC-15, AC-17, AC-18, AC-19) Implementar `client/src/net/office.ts` (`remotePlayers.ts` se hizo en T19 porque depende del búfer); retirar `connect.ts`/`connect.test.ts` (sus casos pasan a `office.test.ts`).
- [x] T18 · (AC-9, AC-11) Test: `client/src/net/interpolation.test.ts` — muestra con 120 ms de retraso, interpola posición y giro corto, sin extrapolar, estable sin datos nuevos.
- [x] T19 · (AC-9, AC-11) Implementar `client/src/net/interpolation.ts`.
- [x] T20 · (AC-10) Test: `client/src/net/sendPolicy.test.ts` — ≤ 12 Hz en marcha, nada quieto, envío final al parar, giro sin desplazamiento también se envía.
- [x] T21 · (AC-10) Implementar `client/src/net/sendPolicy.ts`.
- [x] T22 · (AC-1, AC-12, AC-13) `usePlayerController`: `enabled`, envío con `sendPolicy`, corrección inmediata.
- [x] T23 · (AC-4, AC-6, AC-7, AC-9, AC-11) Escena: `Avatar` con color y nombre (`AvatarBody` compartido), `NameLabel` (sprite), `RemoteAvatar` interpolado, `Scene` con propio + remotos.
- [x] T24 · (AC-1, AC-2, AC-3, AC-4, AC-17, AC-18, AC-19) UI: `EntryScreen` sobre la sala atenuada; `App` y `main.tsx` sin conexión al cargar; `ControlsHint` al entrar.
- [x] T25 · `npm run build` y `npm test` en verde.

### Cambios de la validación manual (2026-11-03)
- [x] T28 · Fix: (AC-9, AC-11) Test: `animation.test.ts` — la fase del paso avanza con la distancia recorrida y es continua: un cambio pequeño de velocidad no produce un salto del balanceo, aunque lleve mucho tiempo andando.
- [x] T29 · Fix: (AC-9, AC-11) Implementar `advanceWalkPhase` y `walkBob(phase, speed)`; `Avatar` acumula la fase por fotograma.
- [x] T30 · Fix: (AC-9) Test: `client/src/net/remoteMotion.test.ts` — con el patrón real (envíos a 12 Hz, parches del servidor a 20 Hz, 60 fps), la velocidad estimada del avatar remoto andando recto se mantiene estable y el squash casi nulo; al pararse vuelve a reposo.
- [x] T31 · Fix: (AC-9) Implementar `client/src/net/remoteMotion.ts` y usarlo en `RemoteAvatar`.
- [x] T32 · (AC-21) Test: `client/src/scene/grain.test.ts` — ruido determinista, en escala de grises, claro (no oscurece el color) y con variación. Implementar `grain.ts` (textura generada en código, una sola vez) y aplicarla como `map` y `roughnessMap` solo a los materiales del avatar.
- [x] T33 · `npm run build` y `npm test` en verde.

### Cambio: colisiones entre avatares (2026-11-04)
- [x] T34 · (AC-22, AC-23, AC-24, AC-25) Test: `shared/avatarCollision.test.ts` — `separateFromAvatars` (para al contacto, desliza tangente, solapados pueden alejarse pero no acercarse, varios a la vez), `moveAvatar` (no empuja dentro de un mueble), `findSpawn` (libre → `SPAWN`; ocupado → hueco libre más cercano, sin muebles ni avatares) y `overlapsAvatar` (margen de un radio, solo si se acerca).
- [x] T35 · Implementar `shared/avatarCollision.ts`.
- [x] T36 · (AC-24, AC-25) Test de integración: segundo en entrar no aparece en `SPAWN` ni solapado; `move` que se mete dentro de otro avatar → `correction`; alejarse de un solape se acepta.
- [x] T37 · (AC-24, AC-25) `OfficeRoom`: `findSpawn` en `onJoin` y `overlapsAvatar` en `handleMove`.
- [x] T38 · (AC-22, AC-23, AC-24) Cliente: el avatar propio empieza en la posición que da el servidor y `usePlayerController` usa `moveAvatar` con las posiciones interpoladas de los demás.
- [x] T39 · `npm run build` y `npm test` en verde.

### Cierre
- [x] T26 · `/sdd-validate-impl` con dos pestañas (cambio visible en cliente, servidor y red).
- [x] T27 · Trazabilidad en `spec.md`, `PLAN.md` (estado, casillas, decisiones) y `/sdd-verify`.
