# Tareas · 005 Audio y video por proximidad

Orden: shared → server → client. Primero el test que falla, luego la implementación.

- [x] T1 · (AC-9, AC-10, AC-11, AC-14) Test: `shared/av.test.ts` (curva de volumen, selección de videos, `parseAvAccess`).
- [x] T2 · (AC-9, AC-10, AC-11, AC-14) Implementar `shared/av.ts`, `MSG.avAccess` y `AvAccess` en `types.ts`.
- [x] T3 · Instalar `livekit-server-sdk` (server) y `livekit-client` (client); anotar en `PLAN.md` > Decisiones.
- [x] T4 · (AC-18) Test: `server/src/config.test.ts` (`getLiveKitConfig`) y `server/src/livekit.test.ts` (token con identidad, nombre, sala y permisos).
- [x] T5 · (AC-18) Implementar `getLiveKitConfig`, `createAccessIssuer`, aviso en arranque; `.env.example`.
- [x] T6 · (AC-2, AC-3) Test: `OfficeRoom.test.ts` (acceso solo para quien está en la sala; `disabled` sin config).
- [x] T7 · (AC-2, AC-3) Implementar el handler `avAccess` en `OfficeRoom` con emisor inyectado.
- [ ] T8 · (AC-4, AC-6, AC-13, AC-15, AC-17) Test + implementar `client/src/store/av.ts`.
- [ ] T9 · (AC-1, AC-3, AC-5, AC-6, AC-7, AC-9..AC-12, AC-14, AC-15, AC-17) Test: `client/src/net/voice.test.ts` con sala falsa.
- [ ] T10 · Implementar `client/src/net/voice.ts` y `net/selfPose.ts`; `usePlayerController` publica la pose propia.
- [ ] T11 · (AC-1, AC-16) Test + implementar en `net/office.ts`: pedir acceso al entrar, entregarlo, cerrar voz al salir.
- [ ] T12 · (AC-8) Test + implementar atajos M/V (`ui/avKeys.ts`) con el filtro de campos de texto.
- [ ] T13 · (AC-4, AC-5, AC-7, AC-14) `ui/AvControls.tsx`, `ui/VideoPanel.tsx`, estilos; montaje en `App.tsx`.
- [ ] T14 · (AC-13) `scene/VoiceIndicator.tsx` junto a la etiqueta.
- [ ] T15 · Validación manual (`/sdd-validate-impl`).
- [ ] T16 · Trazabilidad en `spec.md` y `/sdd-verify`.
