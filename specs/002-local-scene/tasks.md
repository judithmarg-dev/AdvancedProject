# Tareas · 002 Escena local, avatar y movimiento

Orden: shared → server → client. Primero el test que falla, luego la implementación.
Server: sin cambios en esta spec.

- [x] T1 · (AC-8, AC-9, AC-10) Test: `shared/world.test.ts` con las medidas del mundo, bloqueo contra las cuatro paredes, deslizamiento en diagonal y bloqueo contra cada mueble.
- [x] T2 · (AC-8, AC-9, AC-10) Implementar `shared/world.ts` (medidas, `Box2`, `OBSTACLES`, `resolveMovement`) y reexportarlo desde `shared/types.ts`.
- [x] T3 · Añadir `three`, `@react-three/fiber`, `@react-three/drei` y `@types/three` (dev) a `client/`; anotar la decisión en `PLAN.md`.
- [x] T4 · (AC-3, AC-5, AC-15) Test: `client/src/scene/input.test.ts` (W/A/S/D y flechas, diagonal normalizada, `blur`/`visibilitychange` limpian las teclas).
- [x] T5 · (AC-3, AC-5, AC-15) Implementar `client/src/scene/input.ts`.
- [x] T6 · (AC-3, AC-4, AC-6) Test: `client/src/scene/movement.test.ts` (aceleración, frenado < 0,2 s, giro por el camino corto en < 0,3 s).
- [x] T7 · (AC-3, AC-4, AC-6) Implementar `client/src/scene/movement.ts`.
- [x] T8 · (AC-7) Test: `client/src/scene/camera.test.ts` (convergencia al desfase 6/4, sin saltos).
- [x] T9 · (AC-7) Implementar `client/src/scene/camera.ts`.
- [x] T10 · (AC-11, AC-12) Test: `client/src/scene/animation.test.ts` (respiración periódica, squash al acelerar/frenar con retorno a 1, balanceo según velocidad).
- [x] T11 · (AC-11, AC-12) Implementar `client/src/scene/animation.ts`.
- [x] T12 · (AC-1, AC-13) Implementar `client/src/scene/Room.tsx` (suelo, paredes con hueco de ventanal, alfombra y mobiliario desde `OBSTACLES`) y `Lighting.tsx`.
- [x] T13 · (AC-2, AC-6, AC-11, AC-12, AC-13) Implementar `client/src/scene/Avatar.tsx` (cápsula, carita, bracitos y pies; giro, respiración y squash en `useFrame`).
- [x] T14 · (AC-3, AC-4, AC-7, AC-8) Implementar `client/src/scene/usePlayerController.ts` y `Scene.tsx`: unir entrada, movimiento, colisiones y cámara en el bucle de fotogramas.
- [x] T15 · (AC-17) Test: `client/src/ui/controlsHintState.test.ts` (visible al entrar, oculto tras 5 s, no reaparece en la sesión).
- [x] T16 · (AC-17) Implementar `client/src/ui/ControlsHint.tsx` sobre esa lógica.
- [x] T17 · (AC-1, AC-16, AC-18) Montar `App.tsx` + `index.css`: lienzo a pantalla completa, sin scroll; la escena carga aunque el servidor esté caído.
- [x] T18 · (AC-14) Revisión de rendimiento: sin sombras dinámicas innecesarias, sin estado de React por fotograma; comprobar con el contador de fotogramas.
- [x] T19 · `npm run build` y `npm test` en verde; actualizar `PLAN.md` (casillas de la Fase 1, estado actual, decisiones).
- [x] T21 · (AC-2) Fix: la pared sur debe ser realmente transparente para que el avatar se vea al cargar. `palette.ts` usa un color `rgba(...)` cuyo alfa three.js ignora y el material no declara `transparent`/`opacity`. Definir la transparencia en el material de `Room.tsx`, no en el color.
- [x] T22 · (AC-13) Fix: rotar el plano del ventanal de `Room.tsx` (`cielo visible tras el hueco`) para que quede alineado con la pared este en vez de con la pared sur, y limpiar la `rotation` comentada.
- [x] T23 · (AC-8, AC-9) Fix: la caja de la pared este en `shared/world.ts` tenía `minZ`/`maxZ` invertidos, así que era vacía y no detenía al avatar. Detectado al volver a verde `shared/world.test.ts`.
- [x] T24 · (AC-2) Fix: `SPAWN` caía dentro del escritorio (ampliado por el radio del avatar); movido a `{ x: -2, z: 4.5 }`, libre de escritorio y silla.
- [x] T25 · (AC-6) Fix: las expectativas de `movement.test.ts` para izquierda/derecha estaban con el signo invertido; `rotation.y` en three.js es antihorario, luego mirar a +X es -PI/2. Corregido el test, no la implementación.
- [x] T20 · Trazabilidad en `spec.md` y `/sdd-validate-impl` → `/sdd-verify`.
