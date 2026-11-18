# Tareas · 006 Pulido

Orden: shared → server → client. Primero el test que falla, luego la implementación.

- [x] T1 · Instalar devDependencies (`@gltf-transform/*`, `draco3dgltf`) y anotarlas en `PLAN.md` > Decisiones.
- [x] T2 · (AC-1) Test: `roomModel.test.ts` (mallas con nombre sobre las cajas de `FURNITURE`, paredes, pared sur transparente).
- [x] T3 · (AC-1) Implementar `buildRoom()` portando `Room.tsx`.
- [x] T4 · (AC-1) Test + implementar `prepareRoomScene` (sombras, transparencia, ventana).
- [x] T5 · (AC-2, AC-5) Test: `roomAsset.test.ts` (GLB presente, < 5 MB, Draco).
- [x] T6 · (AC-2, AC-5) Script `build-room-model.mts`, `npm run model`, generar `office.glb`.
- [x] T7 · (AC-1, AC-3, AC-4) `Room.tsx`: respaldo + carga del modelo con aviso en consola.
- [x] T8 · (AC-7) `README.md`.
- [ ] T9 · (AC-7) Clon limpio cronometrado: instalar, build, arrancar, entrar.
- [ ] T10 · Validación manual (`/sdd-validate-impl`).
- [ ] T11 · Trazabilidad en `spec.md` y `/sdd-verify`; actualizar `PLAN.md`.
