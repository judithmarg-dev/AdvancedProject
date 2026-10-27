# Plan · 001 Esqueleto del proyecto

## Enfoque
Monorepo npm workspaces con tres paquetes (`shared`, `server`, `client`) y Vitest como runner. El servidor es un
Colyseus mínimo con una `OfficeRoom` sin estado que solo registra altas y bajas; el cliente Vite + React
abre la página y se une a esa sala, logueando conexión, desconexión y error. La lógica de conexión del
cliente y el arranque del servidor se aíslan en funciones pequeñas para poder probarlas sin navegador.
Nada de escena 3D ni estado de jugadores (specs 002 y 003).

## Cambios por capa
### shared
- `shared/types.ts`: constantes `ROOM_NAME = "office"`, `DEFAULT_SERVER_PORT = 2567`, `DEFAULT_CLIENT_PORT = 5173`.
- `shared/package.json` (`@office/shared`), exporta `types.ts` directamente (sin paso de compilación).
- Prueba de constantes (`shared/types.test.ts`).

### server
- `server/src/config.ts`: lee `PORT` (por defecto `DEFAULT_SERVER_PORT`); carga `../.env` con `process.loadEnvFile` si existe (sin dependencia nueva).
- `server/src/rooms/OfficeRoom.ts`: sala sin estado; `onJoin`/`onLeave` registran en consola (español).
- `server/src/server.ts`: `createGameServer()` registra `OfficeRoom` bajo `ROOM_NAME`; `startServer(port)` hace `listen`, loguea la dirección y, si falla con `EADDRINUSE`, loguea "puerto en uso" y rechaza (Colyseus no rechaza por sí solo: se escucha el `error` del `http.Server`).
- `server/src/index.ts`: entrada; carga `.env`, llama a `startServer` y sale con código 1 si falla.
- Scripts: `dev` (`tsx watch`), `build` (`tsc --noEmit`), `test` (`vitest run`).

### client
- `client/` Vite + React + TS; `index.html`, `src/main.tsx`, `src/App.tsx` mínimo (título, sin escena).
- `client/src/net/connect.ts`: `connectToServer(url, deps)` hace `joinOrCreate(ROOM_NAME)`; loguea conexión exitosa, desconexión (`onLeave`) y error de conexión (`console.error`) sin lanzar a la UI. `deps` permite inyectar el cliente y el logger en pruebas.
- URL del servidor desde `VITE_SERVER_URL` (por defecto `ws://localhost:2567`); `vite.config.ts` con `envDir: ".."` (un solo `.env` raíz) y puerto 5173.
- Carpetas `scene/`, `store/`, `ui/` quedan vacías hasta que se necesiten (no se crean).

### raíz
- `package.json` (private, `engines.node >=20.12`), campo `workspaces`, `tsconfig.base.json` (strict), `.gitignore` (incluye `.env`), `.env.example` (`PORT`, `VITE_SERVER_URL`).
- Scripts raíz: `dev` → `concurrently` con `npm run dev -w server` y `npm run dev -w client`; `build` → `npm run build --workspaces`; `test` → `npm test --workspaces`.

## Contratos de red
| Mensaje / endpoint | Dirección | Payload (tipo en `shared/`) | Respuestas / errores |
|---|---|---|---|
| Unirse a la sala `ROOM_NAME` (`joinOrCreate`) | cliente → servidor | ninguno (sin opciones) | Éxito: sala unida. Error: el cliente lo registra en consola. |
| Cierre de sesión (servidor detenido / cliente sale) | ambos | ninguno | `onLeave` en cliente; `onLeave` en servidor. |

No se definen mensajes de juego en esta spec.

## Verificación de constitución
| Artículo | ¿Cumple? | Justificación |
|---|---|---|
| I | Sí | La spec describe qué y por qué; el cómo vive aquí. |
| II | Sí | No hay estado ni mensajes de cliente; la sala es del servidor. |
| III | Sí | `ROOM_NAME` y puertos solo en `shared/types.ts`; `strict` en `tsconfig.base.json`. |
| IV | Sí | Cada tarea de código va precedida de su test fallido. |
| V | Sí | Dependencias anotadas en Decisiones (abajo y en `PLAN.md`). |
| VI | Sí | Variables en `.env`, `.env.example` versionado, `.env` en `.gitignore`. |
| VII | Sí | Solo esqueleto; sin three/r3f/zustand hasta la spec 002. |

## Decisiones
- **Dependencias nuevas** (también en `PLAN.md` > Decisiones):
  - Raíz/dev: `typescript`, `vitest`, `tsx`, `concurrently`.
  - server: `@colyseus/core`, `@colyseus/ws-transport`; dev: `@colyseus/testing`, `@colyseus/sdk`, `@colyseus/tools` (peers de testing).
  - client: `react`, `react-dom`, `@colyseus/sdk`, `vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom` (dev).
- **Colyseus 0.18:** se usa `@colyseus/core` + `@colyseus/ws-transport` en lugar del meta-paquete `colyseus` (arrastra `uWebSockets.js` desde git, bloqueado por pnpm). El cliente es `@colyseus/sdk` (sustituye a `colyseus.js`).
- **npm en lugar de pnpm (cambio del humano, 2026-10-22):** pnpm creaba enlaces simbólicos de WSL que Windows no resolvía. `shared` se referencia como `"*"` (npm no admite `workspace:*`).
- **Sin `dotenv`:** `process.loadEnvFile` (Node ≥ 20.12) cubre la carga; por eso `engines` pide 20.12 y no 20.0. Descartado: `dotenv` (dependencia extra).
- **`concurrently` (dev, raíz):** npm no tiene modo paralelo; se necesita para `npm run dev`. Descartado: `npm-run-all`, scripts con `&` (no portables a Windows).
- **`shared` sin compilar:** se consume como fuente TS (tsx y Vite lo resuelven). Descartado: `tsc` con project references (complica el dev). Consecuencia: `build` del servidor es verificación de tipos (`tsc --noEmit`); en producción se ejecuta con `tsx`. Aceptable para el MVP.
- **Diferidos:** three, @react-three/fiber, drei, zustand (spec 002); livekit (spec 005).
- **Tests de cliente en entorno `node`,** con cliente y logger inyectados; sin jsdom (no hace falta en esta fase).

## Riesgos
- **Entorno Windows + WSL:** `node` en WSL es un enlace a `node.exe`. Instalar y ejecutar siempre desde una terminal nativa de Windows; hacerlo desde WSL crea enlaces simbólicos de WSL que Windows no resuelve.
- **Proyecto en `/mnt/c` (drvfs):** instalar con npm puede ser lento o fallar con enlaces simbólicos. Si ocurre, parar y proponer opción al humano.

## Estrategia de pruebas
| AC | Tipo | Archivo / razón |
|---|---|---|
| AC-1 | manual | `sdd-validate-impl`: levantar con `npm run dev` y ver los dos logs de escucha (procesos de larga vida y consola real). |
| AC-2 | manual | `sdd-validate-impl`: abrir la página en el navegador y revisar la consola (necesita navegador). |
| AC-3 | unit + manual | `client/src/net/connect.test.ts` (log de éxito con cliente simulado); confirmación real en `sdd-validate-impl`. |
| AC-4 | integración | `server/src/rooms/OfficeRoom.test.ts` (`@colyseus/testing`: al unirse, se registra la conexión). |
| AC-5 | unit + integración | `connect.test.ts` (`onLeave` → log de desconexión); `OfficeRoom.test.ts` (baja registrada); confirmación real en `sdd-validate-impl`. |
| AC-6 | integración | `server/src/server.test.ts`: `index.ts` como proceso hijo arranca, se mata y arranca de nuevo; un cliente se vuelve a unir (un reinicio real es un proceso nuevo: el matchmaker de Colyseus es global por proceso). |
| AC-7 | unit + manual | `connect.test.ts` (fallo → `console.error` sin lanzar); página sin pantalla en blanco en `sdd-validate-impl`. |
| AC-8 | build | `npm run build` pasa en los tres paquetes (verificado en `sdd-verify`). |
| AC-9 | build | `npm test` corre los tres paquetes; cada uno tiene ≥ 1 prueba (`shared/types.test.ts`, `server/*.test.ts`, `client/*.test.ts`). |
| AC-10 | unit + build | `shared/types.test.ts` y `OfficeRoom.test.ts` (la sala se registra con `ROOM_NAME`); el fallo por cambio incompatible lo da `tsc` en `npm run build` (se comprueba una vez a mano en `sdd-verify`). |
| AC-11 | unit | `shared/env.test.ts`: `.env.example` contiene `PORT` y `VITE_SERVER_URL`; `.gitignore` contiene `.env`. |
| AC-12 | integración | `server/src/server.test.ts`: segundo `startServer` en el mismo puerto rechaza con `EADDRINUSE` y se loguea; el proceso `index.ts` sale con código 1. |
