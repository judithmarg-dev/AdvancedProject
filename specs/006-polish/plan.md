# Plan · 006 Pulido

## Enfoque
La geometría de la sala pasa de JSX a una función de three puro (`buildRoom()`), que sirve a la vez como sala de
respaldo en el cliente y como fuente del modelo por defecto: un script de Node la exporta a glTF binario y la
comprime con Draco en `client/public/models/office.glb`. El cliente carga ese archivo con `GLTFLoader` +
`DRACOLoader` (de `three/examples`, sin dependencias nuevas de ejecución), restaura sombras y transparencias
que glTF no guarda y, mientras carga o si falla, muestra la sala de respaldo. README en la raíz.

## Cambios por capa
### shared
- Sin cambios (medidas en `world.ts`).

### server
- Sin cambios.

### client
- `scene/roomModel.ts`: `buildRoom(): Group` (puerto 1:1 de `Room.tsx`, nombres en cada malla para identificarlas).
- `scene/roomModelSetup.ts`: `prepareRoomScene(root)` — sombras, pared sur sin escritura de profundidad, ventana sin sombras.
- `scene/Room.tsx`: estado `fallback | model`; carga asíncrona con aviso en consola si falla.
- `scripts/build-room-model.mts`: exporta `buildRoom()` con `GLTFExporter` y comprime con `@gltf-transform` + `draco3dgltf`.
- `public/models/office.glb` (generado y versionado). El decodificador Draco lo empaqueta three (`DRACOLoader` por defecto).
- `npm run model -w client` regenera el modelo.

### docs
- `README.md`: requisitos, instalación, `.env`, arranque, voz con Docker, sustituir el modelo, pruebas.

## Contratos de red
| Mensaje / endpoint | Dirección | Payload (tipo en `shared/`) | Respuestas / errores |
|---|---|---|---|
| (ninguno) | | | |

## Verificación de constitución
| Artículo | ¿Cumple? | Justificación |
|---|---|---|
| I | Sí | La spec no nombra bibliotecas salvo el formato del archivo, que es requisito de la fase. |
| II | Sí | Sin cambios de estado de red. |
| III | Sí | Sin tipos de red nuevos. |
| IV | Sí | Tests de `buildRoom` (mallas sobre las cajas de colisión), del peso del GLB y de `prepareRoomScene`. |
| V | Sí | `@gltf-transform/core`, `/extensions`, `/functions` 4.5.1 y `draco3dgltf` 1.5.9 como devDependencies del cliente, anotadas. |
| VI | Sí | Sin secretos. |
| VII | Sí | Solo Fase 5. |

## Decisiones
- Modelo generado por código en lugar de modelado en Blender (no disponible); el archivo es sustituible (AC-5).
- Colisiones siguen en `shared/world.ts`: leerlas del GLB rompería la autoridad del servidor.
- Decodificador Draco: el que three 0.186 empaqueta con la página (por defecto en `DRACOLoader`), en lugar de un CDN: funciona sin internet.

## Estrategia de pruebas
| AC | Tipo | Archivo |
|---|---|---|
| AC-1 | unit + manual | `client/src/scene/roomModel.test.ts`, `roomModelSetup.test.ts`; aspecto: manual |
| AC-2 | unit | `client/src/scene/roomAsset.test.ts` (existe, < 5 MB, cabecera glTF, extensión Draco) |
| AC-3, AC-4 | manual | carga real en navegador (red, WebGL) |
| AC-5 | unit + manual | `roomAsset.test.ts`; regenerar con `npm run model -w client` |
| AC-6 | unit (existente) | `client/src/scene/animation.test.ts` |
| AC-7 | manual | clon limpio cronometrado |
| AC-8 | manual | fps y colisiones en navegador |
