# Próximos pasos

Mejoras pendientes tras cerrar el MVP (specs 001–006). Cada bloque funcional debe pasar por el flujo SDD de
`CLAUDE.md` (spec → clarify → plan → implement → validate → verify) antes de escribir código.

## 1. Pendientes del MVP (hacer primero)

- [ ] **Validación manual de la spec 005** (voz y video): filas V1–V16 de `specs/005-proximity-av/spec.md`.
  Requiere LiveKit en Docker (comando en el README), `.env` copiado de `.env.example`, dos navegadores y auriculares.
  Clave: V8 («Hecho cuando» de la Fase 4: al alejarte dejas de oír gradualmente).
- [ ] **Validación manual de la spec 006** (pulido): filas V1–V6 de `specs/006-polish/spec.md`.
- [ ] Si alguna fila falla: `/sdd-validate-impl` y reabrir tareas `Fix: ...` en el `tasks.md` correspondiente.
- [ ] **Sala modelada en Blender:** sustituir `client/public/models/office.glb` (hoy generado por
  `npm run model -w client`) por la exportación propia: *Archivo → Exportar → glTF 2.0*, formato *glTF Binary*,
  compresión Draco activada, < 5 MB. Si cambia la distribución de muebles, actualizar `WALLS` y `FURNITURE` en
  `shared/world.ts` (las colisiones salen de ahí, no del modelo).
- [ ] **Fusionar ramas en `main`:** `spec/004-chat`, `spec/005-proximity-av` y `spec/006-polish` están encadenadas
  y sin fusionar.
- [ ] **`npm audit`:** 6 alertas altas en la cadena de Vite (`picomatch`, `tinyglobby`), anteriores a la Fase 4.
  Revisar si hay versión de Vite que las corrija sin romper la build.

## 2. Despliegue público (spec 007 propuesta)

Vercel solo puede alojar el cliente: no mantiene conexiones WebSocket abiertas ni procesos con estado, así que
el servidor Colyseus necesita otro proveedor.

| Pieza | Dónde | Motivo |
|---|---|---|
| Cliente (Vite, estático) | Vercel o Netlify | Web estática con HTTPS incluido |
| Servidor Colyseus | Render, Railway o Fly.io | Proceso persistente con WebSocket (`wss://`) |
| Audio/video | LiveKit Cloud (plan gratuito) | El Docker local no es accesible desde internet |

### Cambios necesarios en el proyecto

- [ ] **Servidor:** añadir script `start` en `server/package.json` (hoy solo existe `dev`), p. ej.
  `tsx src/index.ts`, y el archivo del proveedor (`render.yaml` o `Dockerfile`). `PORT` ya se lee del entorno.
- [ ] **Variables del servidor en el proveedor:** `PORT` (la suele fijar el proveedor), `LIVEKIT_URL`
  (`wss://<proyecto>.livekit.cloud`), `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. Nunca en el repo (artículo VI).
- [ ] **Cliente en Vercel:** raíz del proyecto en el repo, comando `npm run build -w client`, salida
  `client/dist`, variable `VITE_SERVER_URL=wss://<servidor>` **antes del build** (Vite la incrusta al compilar).
- [ ] **Comprobar CORS** del matchmaking de Colyseus entre el dominio de Vercel y el del servidor.
- [ ] **Decisión en `PLAN.md`:** LiveKit Cloud en producción (la spec 005 fijó Docker local solo para desarrollo).
- [ ] **README:** sección «Despliegue» con estos pasos.

### A tener en cuenta

- Micrófono y cámara solo funcionan con HTTPS: Vercel y Render lo dan por defecto.
- Los planes gratuitos de Render/Railway apagan el servidor sin uso: la primera entrada puede tardar 30–60 s
  y la sala (incluido el historial del chat, que vive en memoria) se vacía al apagarse.
- Crear cuentas y desplegar publica la app: confirmar proveedor antes de hacerlo.

## 3. Backlog posterior al MVP (de `PLAN.md`)

Cada punto es una spec nueva; algunos estaban fuera de alcance del MVP a propósito.

- **Zonas privadas / burbujas de audio:** salas de reunión donde solo se oye a quien está dentro.
- **Múltiples salas:** hoy hay una única sala `office`; el matchmaking y el acceso de LiveKit están ligados a ella.
- **Autenticación real:** hoy basta un nombre; nombres repetidos permitidos.
- **Persistencia:** historial del chat y estado en base de datos (hoy todo en memoria).
- **Avatares personalizables** y animaciones esqueléticas (Mixamo) en lugar de la respiración/balanceo actuales.
- **Editor de mapas** y colisiones derivadas del modelo 3D.
- **Pruebas de carga** con más de 20 usuarios (límite actual `MAX_PLAYERS`).
- **Mejoras de audio:** espacial estéreo según orientación, selección de dispositivo, compartir pantalla.

## 4. Mejoras técnicas menores

- **Tamaño del bundle:** Vite avisa de un chunk > 500 kB (three + livekit-client). Valorar `import()` diferido
  de LiveKit y del cargador GLTF.
- **Pruebas de UI:** no hay DOM de pruebas; los botones, el panel de video y el foco del chat se validan a mano.
  Valorar `@testing-library/react` + `jsdom` (dependencia nueva: anotarla en `PLAN.md`).
- **Prueba de integración con LiveKit real** en CI (contenedor `livekit-server --dev`) para cubrir AC-1/AC-5 de la
  spec 005 sin intervención manual.
