# Tareas · 001 Esqueleto del proyecto

Orden: shared → server → client. Primero el test que falla, luego la implementación.

## Entorno y raíz
- [ ] T1 · (AC-1, AC-8, AC-9) Dejar `pnpm` funcional en WSL (Node de Linux, `pnpm -v` responde) y confirmar que instalar en `/mnt/c` funciona.
- [ ] T2 · (AC-1, AC-8, AC-9, AC-11) Raíz: `package.json` (scripts `dev`/`build`/`test`, `engines`), `pnpm-workspace.yaml`, `tsconfig.base.json` estricto, `.gitignore` con `.env`, `.env.example` (`PORT`, `VITE_SERVER_URL`).

## shared
- [ ] T3 · (AC-9, AC-10) Test: `shared/types.test.ts` espera `ROOM_NAME`, `DEFAULT_SERVER_PORT = 2567`, `DEFAULT_CLIENT_PORT = 5173`. Verlo fallar.
- [ ] T4 · (AC-9, AC-10) Implementar `shared/types.ts` y `shared/package.json`; instalar `typescript` y `vitest`.
- [ ] T5 · (AC-11) Test: `shared/env.test.ts` (`.env.example` con `PORT` y `VITE_SERVER_URL`; `.gitignore` con `.env`). Verlo fallar si falta algo, luego ajustar T2.

## server
- [ ] T6 · (AC-4, AC-5, AC-10) Test: `server/src/rooms/OfficeRoom.test.ts` con `@colyseus/testing`: sala bajo `ROOM_NAME`; al unirse y al salir se registra el log. Verlo fallar.
- [ ] T7 · (AC-4, AC-5, AC-10) Implementar `OfficeRoom.ts` (sin estado, logs en español); instalar `colyseus`, `@colyseus/ws-transport`, `@colyseus/testing`, `tsx`.
- [ ] T8 · (AC-6, AC-12) Test: `server/src/index.test.ts`: arrancar → detener → arrancar y unirse (AC-6); segundo `startServer` en el mismo puerto rechaza con `EADDRINUSE` y loguea (AC-12). Verlo fallar.
- [ ] T9 · (AC-1, AC-6, AC-12) Implementar `config.ts` (`PORT`, carga de `.env`) e `index.ts` (`startServer`, log de dirección, salida con código 1 si el puerto está en uso); script `dev`.

## client
- [ ] T10 · (AC-3, AC-5, AC-7) Test: `client/src/net/connect.test.ts` con cliente y logger simulados: éxito → log de conexión; `onLeave` → log de desconexión; fallo → `console.error` sin lanzar. Verlo fallar.
- [ ] T11 · (AC-3, AC-5, AC-7) Implementar `net/connect.ts`; instalar `colyseus.js`.
- [ ] T12 · (AC-1, AC-2, AC-3, AC-7) Cliente Vite + React: `index.html`, `main.tsx`, `App.tsx` mínimo que llama a `connectToServer` con `VITE_SERVER_URL`; `vite.config.ts` (`envDir: ".."`, puerto 5173); scripts `dev`/`build`/`test`.

## Cierre
- [ ] T13 · (AC-8, AC-9, AC-10) Correr `pnpm run build` y `pnpm test` en la raíz; comprobar a mano que un cambio incompatible en `shared` rompe la compilación y revertirlo.
- [ ] T14 · Anotar las dependencias en `PLAN.md` > Decisiones (Vitest, Colyseus, etc.).
- [ ] T15 · Validación manual con `/sdd-validate-impl` (AC-1, AC-2, AC-3, AC-5, AC-7).
- [ ] T16 · Trazabilidad en `spec.md` y `/sdd-verify`; actualizar "Estado actual" y casillas de `PLAN.md`.
