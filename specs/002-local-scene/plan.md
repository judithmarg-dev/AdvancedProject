# Plan · 002 Escena local, avatar y movimiento

## Enfoque
La escena es de un solo usuario y sin red: toda la novedad vive en `client/`, salvo las medidas del mundo
y la resolución de colisiones, que van a `shared/` porque en la spec 003 el servidor tendrá que validar
posiciones con los mismos números (Constitución II). La lógica que se puede probar sin navegador
(dirección desde teclas, aceleración, giro, colisión AABB con deslizamiento, seguimiento de cámara,
curvas de animación) se aísla en módulos puros con test unitario; los componentes de React Three Fiber
solo leen esos módulos dentro del bucle de fotogramas y escriben sobre refs, sin estado de React por
fotograma. El aspecto (sala, luces, materiales, carita del avatar) se valida a mano contra la referencia.

## Cambios por capa

### shared
- `shared/world.ts` (nuevo), reexportado desde `shared/types.ts`:
  - `ROOM_SIZE = { width: 16, depth: 12 }`, `WALL_HEIGHT`, `WALL_THICKNESS`, `SPAWN = { x, z }`.
  - `AVATAR = { height: 1, radius: 0.35 }`, `MOVE_SPEED = 3`, `ACCELERATION`/`DECELERATION` (frenado < 0,2 s), `TURN_SPEED` (180° en < 0,3 s).
  - `CAMERA_OFFSET = { back: 6, up: 4 }`, `CAMERA_SMOOTHING`.
  - `type Box2 = { minX; maxX; minZ; maxZ }` y `OBSTACLES: Box2[]` (4 paredes + escritorio, silla, mueble bajo, plantas) derivados de `ROOM_SIZE`.
  - `resolveMovement(position, delta, radius, boxes)`: resuelve eje X y eje Z por separado contra los AABB (expandidos por el radio del avatar) y devuelve la posición final; el eje bloqueado se anula y el libre se conserva → deslizamiento (AC-9).
- `shared/world.test.ts`: pruebas de colisión y deslizamiento.

### server
- Sin cambios. Esta fase no envía ni valida posiciones (la sala sigue siendo la de la spec 001).

### client
- `src/scene/input.ts`: `createKeyboardInput(target)` escucha `keydown`/`keyup` y `blur`/`visibilitychange`
  (limpia todas las teclas, AC-15); `directionFromKeys(keys)` devuelve un vector normalizado (diagonal a la
  misma velocidad, AC-5). Mapea W/A/S/D y flechas.
- `src/scene/movement.ts`: `stepVelocity(velocity, desired, dt)` (aceleración/frenado) y
  `turnToward(current, target, dt)` (ángulo más corto, interpolado).
- `src/scene/camera.ts`: `followCamera(currentPos, avatarPos, avatarAngle, dt)` → posición amortiguada
  detrás y encima del avatar y punto de mira.
- `src/scene/animation.ts`: `breathingOffset(t)` (AC-11) y `squashScale(speed, acceleration)` →
  `{ scaleX, scaleY }` con retorno elástico a 1 (AC-12), más `walkBob(t, speed)`.
- `src/scene/Avatar.tsx`: cápsula redondeada verde pastel, dos ojos, boca curva, bracitos y pies;
  aplica dirección, giro, respiración y squash en `useFrame` sobre refs.
- `src/scene/Room.tsx`: suelo, cuatro paredes (una con hueco de ventanal), alfombra, y mobiliario simple
  (escritorio + silla, mueble bajo con estantes, dos plantas) construido con primitivas y la paleta de la
  referencia. Las cajas de colisión salen de `OBSTACLES`, no se duplican aquí.
- `src/scene/Lighting.tsx`: luz ambiental suave + direccional cálida desde el ventanal + sombras de contacto.
- `src/scene/Scene.tsx`: `<Canvas>` a pantalla completa, cámara, `Room`, `Avatar`, controlador de movimiento
  (`usePlayerController`) y cámara de seguimiento.
- `src/ui/ControlsHint.tsx`: aviso "WASD o flechas para moverte" que se desvanece a los 5 s, una vez por sesión (AC-17).
- `src/App.tsx`: pasa a renderizar `Scene` + `ControlsHint`; `src/index.css` (lienzo a pantalla completa, sin scroll).
- `main.tsx`: sin cambios (la conexión de la spec 001 sigue aparte y no bloquea la escena, AC-18).
- Tests nuevos: `input.test.ts`, `movement.test.ts`, `camera.test.ts`, `animation.test.ts`, `ControlsHint` (lógica del temporizador en `src/ui/controlsHint.ts`, sin DOM).

## Contratos de red
| Mensaje / endpoint | Dirección | Payload (tipo en `shared/`) | Respuestas / errores |
|---|---|---|---|
| — | — | — | Esta spec no añade mensajes. La conexión de la spec 001 se mantiene intacta. |

## Verificación de constitución
| Artículo | ¿Cumple? | Justificación |
|---|---|---|
| I | Sí | El `cómo` (R3F, módulos, refs) está solo aquí; la spec habla de sala, avatar y cámara. |
| II | Sí | No hay estado compartido todavía; las medidas y la colisión viven en `shared/` para que el servidor las use como autoridad en la spec 003. |
| III | Sí | No hay tipos de red nuevos; `Box2` y constantes del mundo en `shared/`. Sin `any`. |
| IV | Sí | Cada módulo puro lleva su test fallido antes de la implementación. |
| V | Sí | Dependencias nuevas anotadas abajo y en `PLAN.md` > Decisiones (ya previstas en la tabla de stack). |
| VI | Sí | Sin variables de entorno nuevas; `.env.example` no cambia. |
| VII | Sí | Solo escena local; sin sincronización, chat ni audio. |

## Decisiones
- **Dependencias nuevas** (también en `PLAN.md` > Decisiones): `three`, `@react-three/fiber` (client, ya en la
  tabla de stack); `@types/three` (client, dev). `@react-three/drei` se instaló y se retiró en T18: la sala, el
  avatar y la sombra de contacto se resuelven con primitivas de three, así que no quedó ningún uso; vuelve a
  evaluarse en la Fase 5 (carga de GLB). Descartado por ahora: `zustand` — en esta fase
  no hay estado compartido entre componentes y el movimiento vive en refs por fotograma; entra en la spec 003.
- **Colisiones en `shared/` y no en `client/`:** `CLAUDE.md` permite probar la lógica pura en cualquiera de los dos,
  pero en la spec 003 el servidor debe aceptar o corregir posiciones con las mismas cajas. Evita duplicar números.
- **Resolución por ejes separados (X y luego Z)** en vez de un barrido continuo: con 3 m/s y ~60 fps el avance por
  fotograma (≈5 cm) es muy inferior al grosor de las cajas, así que no hay túnel. Descartado: motor de física
  (fuera de alcance), barrido continuo (complejidad innecesaria).
- **Movimiento relativo a la cámara (AC-3)** con cámara de orientación fija detrás del avatar: equivale a movimiento
  relativo al mundo mientras no haya control de cámara por ratón (fuera de alcance). Se implementa ya con la base de
  la cámara para no reescribirlo cuando se añada el ratón.
- **Sin estado de React por fotograma:** posición, velocidad y ángulo en refs; React solo renderiza la estructura.
  Es lo que permite sostener 60 fps (AC-14).
- **Carita del avatar:** geometría simple (dos esferas aplastadas y un toro recortado para la boca), hija del cuerpo,
  de modo que gira con él (AC-6). Descartado: textura con la cara (requiere asset y no aporta nada en esta fase).
- **Ventanal:** hueco construido con tres cajas (dintel y dos jambas) en lugar de geometría recortada; es lo más
  barato y el cristal no es necesario.
- **Sombras:** una sola luz direccional proyecta sombras (mapa 1024) y bajo el avatar va un disco translúcido
  como sombra de contacto, en vez de sombras dinámicas de todas las luces, por coste en fotogramas.
- **Tests sin DOM:** entorno `node`, como en la spec 001; la lógica del aviso de controles se extrae a una función
  pura (`controlsHintState.ts`) para poder probarla sin jsdom. Descartado: añadir `jsdom` y Testing Library.

## Riesgos
- **Rendimiento (AC-14):** sombras y materiales físicos pueden bajar de 60 fps en equipos modestos. Mitigación:
  sombras de contacto, materiales estándar, sin posprocesado.
- **Paquete `three` grande:** el arranque en desarrollo puede tardar la primera vez (prebundle de Vite). No afecta al build.
- **Aspecto frente a la referencia (AC-13):** es un criterio visual; se cierra en `sdd-validate-impl` con capturas.

## Estrategia de pruebas
| AC | Tipo | Archivo / razón |
|---|---|---|
| AC-1 | manual | `sdd-validate-impl`: la escena 3D y la consola del navegador no se automatizan (`CLAUDE.md` > Pruebas). |
| AC-2 | manual | Ídem: presencia y forma del avatar es visual. |
| AC-3 | unit + manual | `client/src/scene/input.test.ts` (teclas → dirección) y `movement.test.ts` (avance continuo); recorrido real en validación. |
| AC-4 | unit | `movement.test.ts`: al soltar, la velocidad llega a 0 en < 0,2 s y no hay desplazamiento residual. |
| AC-5 | unit | `input.test.ts`: dos teclas → vector de módulo 1 (misma velocidad que en recta). |
| AC-6 | unit | `movement.test.ts`: `turnToward` toma el camino corto y completa 180° en < 0,3 s. |
| AC-7 | unit + manual | `camera.test.ts`: la cámara converge al desfase (6 detrás / 4 arriba) y no salta; encuadre real en validación. |
| AC-8 | unit | `shared/world.test.ts`: avance contra cada pared → posición limitada dentro de la sala. |
| AC-9 | unit | `shared/world.test.ts`: avance diagonal contra una pared → componente paralelo conservado. |
| AC-10 | unit | `shared/world.test.ts`: avance contra escritorio, silla, mueble y planta → bloqueado. |
| AC-11 | unit + manual | `animation.test.ts`: `breathingOffset` oscila y es periódica; percepción en validación. |
| AC-12 | unit + manual | `animation.test.ts`: `squashScale` deforma al acelerar/frenar y vuelve a 1; percepción en validación. |
| AC-13 | manual | Criterio visual contra `shared/assets/Multimedia.jpeg`; no automatizable. |
| AC-14 | manual | Medición con el contador de fotogramas del navegador durante un minuto. |
| AC-15 | unit + manual | `input.test.ts`: `blur` y `visibilitychange` vacían el conjunto de teclas. |
| AC-16 | manual | Redimensionado real de la ventana (el lienzo lo gestiona R3F); no automatizable sin navegador. |
| AC-17 | unit + manual | `controlsHintState.test.ts`: visible al entrar, oculto tras 5 s y no reaparece; aspecto en validación. |
| AC-18 | manual | `sdd-validate-impl`: con el servidor parado, la escena carga y se recorre; la consola informa del fallo (spec 001 AC-7). |
