# Tareas · 001 Esqueleto del proyecto

Orden: shared → server → client. Primero el test que falla, luego la implementación.

## Entorno y raíz
- [x] T1 · (AC-1, AC-8, AC-9) Dejar el gestor de paquetes funcional (cambiado a npm workspaces; instalar desde terminal de Windows).
- [x] T2 · (AC-1, AC-8, AC-9, AC-11) Raíz: `package.json` (scripts `dev`/`build`/`test`, `engines`), campo `workspaces`, `tsconfig.base.json` estricto, `.gitignore` con `.env`, `.env.example` (`PORT`, `VITE_SERVER_URL`).

## shared
- [x] T3 · (AC-9, AC-10) Test: `shared/types.test.ts` espera `ROOM_NAME`, `DEFAULT_SERVER_PORT = 2567`, `DEFAULT_CLIENT_PORT = 5173`. Verlo fallar.
- [x] T4 · (AC-9, AC-10) Implementar `shared/types.ts` y `shared/package.json`; instalar `typescript` y `vitest`.
- [x] T5 · (AC-11) Test: `shared/env.test.ts` (`.env.example` con `PORT` y `VITE_SERVER_URL`; `.gitignore` con `.env`). Verlo fallar si falta algo, luego ajustar T2.

## server
- [x] T6 · (AC-4, AC-5, AC-10) Test: `server/src/rooms/OfficeRoom.test.ts` con `@colyseus/testing`: sala bajo `ROOM_NAME`; al unirse y al salir se registra el log. Verlo fallar.
- [x] T7 · (AC-4, AC-5, AC-10) Implementar `OfficeRoom.ts` (sin estado, logs en español); instalar `colyseus`, `@colyseus/ws-transport`, `@colyseus/testing`, `tsx`.
- [x] T8 · (AC-6, AC-12) Test: `server/src/index.test.ts`: arrancar → detener → arrancar y unirse (AC-6); segundo `startServer` en el mismo puerto rechaza con `EADDRINUSE` y loguea (AC-12). Verlo fallar.
- [x] T9 · (AC-1, AC-6, AC-12) Implementar `config.ts` (`PORT`, carga de `.env`) e `index.ts` (`startServer`, log de dirección, salida con código 1 si el puerto está en uso); script `dev`.

## client
- [x] T10 · (AC-3, AC-5, AC-7) Test: `client/src/net/connect.test.ts` con cliente y logger simulados: éxito → log de conexión; `onLeave` → log de desconexión; fallo → `console.error` sin lanzar. Verlo fallar.
- [x] T11 · (AC-3, AC-5, AC-7) Implementar `net/connect.ts`; instalar `colyseus.js`.
- [x] T12 · (AC-1, AC-2, AC-3, AC-7) Cliente Vite + React: `index.html`, `main.tsx`, `App.tsx` mínimo que llama a `connectToServer` con `VITE_SERVER_URL`; `vite.config.ts` (`envDir: ".."`, puerto 5173); scripts `dev`/`build`/`test`.

## Cierre
- [x] T13 · (AC-8, AC-9, AC-10) Correr `npm run build` y `npm test` en la raíz; comprobar a mano que un cambio incompatible en `shared` rompe la compilación y revertirlo.
- [x] T14 · Anotar las dependencias en `PLAN.md` > Decisiones (Vitest, Colyseus, etc.).
- [x] T15 · Validación manual con `/sdd-validate-impl` (AC-1, AC-2, AC-3, AC-5, AC-7).
- [x] T16 · Trazabilidad en `spec.md` y `/sdd-verify`; actualizar "Estado actual" y casillas de `PLAN.md`.
