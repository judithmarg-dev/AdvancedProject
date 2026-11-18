# MVP: Oficina Virtual 3D (estilo Gather Town)

> Documento de traspaso. Cualquier modelo o persona debe leer este archivo primero,
> revisar "Estado actual" y continuar con la primera fase sin completar.

## Objetivo
Una sala 3D en el navegador donde varios usuarios se mueven con avatares, chatean y
se oyen/ven por proximidad. Debe servir como plantilla reutilizable (oficina, eventos, onboarding).

## Fuera de alcance del MVP
Editor de mapas, múltiples salas, autenticación real, moderación, persistencia en BD,
escalado a más de ~20 usuarios, personalización de avatares.

## Stack (decisiones cerradas, no re-discutir)
| Área | Elección | Motivo |
|---|---|---|
| Frontend | Vite + React + TypeScript | Arranque rápido |
| 3D | three + @react-three/fiber + @react-three/drei | Ecosistema grande, poco código |
| Estado cliente | zustand | Simple |
| Servidor tiempo real | Node + Colyseus | Salas y sincronización de estado listas |
| Audio/video | LiveKit (Cloud free tier o Docker local) | Evita montar un SFU propio |
| Modelos | glTF/GLB, sala propia en Blender | Aprovecha el modelado 3D |
| Monorepo | npm workspaces: `client/`, `server/`, `shared/` | Tipos compartidos |

## Estructura objetivo
```
AdvancedProject/
  PLAN.md
  CLAUDE.md            # reglas cortas para el asistente (ver abajo)
  shared/  types.ts    # PlayerState, mensajes, constantes
  server/  src/rooms/OfficeRoom.ts, src/index.ts
  client/  src/{scene,net,ui,store}/, public/models/
```

## Fases (marcar [x] al terminar)

### Fase 0: Esqueleto (~1 h)
- [x] Monorepo con workspaces, TS configurado, `npm run dev` levanta client y server.
- [x] Crear CLAUDE.md con las convenciones de abajo.
- **Hecho cuando**: la página carga y el cliente se conecta al servidor (log en consola).

### Fase 1: Escena y movimiento local
- [x] Canvas R3F con luces, suelo y una sala (empezar con cajas; luego GLB propio).
- [x] Avatar (cápsula) controlado con WASD.
- [x] Cámara tercera persona que sigue al avatar.
- [x] Colisiones simples con paredes (límites AABB, sin motor de física).
- **Hecho cuando**: caminas por la sala sin atravesar paredes a 60 fps. ✔ (validado a mano el 2026-10-27, spec 002)

### Fase 2: Multijugador
- [x] `OfficeRoom` en Colyseus con schema `Player {id, name, x, z, rotY, color}`.
- [x] Cliente envía posición (~10-15 Hz); interpola la de los demás.
- [x] Pantalla de entrada con nombre; etiqueta flotante sobre cada avatar.
- [x] Alta/baja de jugadores limpia.
- **Hecho cuando**: dos pestañas se ven moverse entre sí con fluidez.

### Fase 3: Chat
- [x] Mensajes por sala, panel UI, burbuja corta sobre el avatar.
- **Hecho cuando**: un mensaje en una pestaña aparece en la otra. ✔ (validado a mano el 2026-11-10, spec 004)

### Fase 4: Audio/video por proximidad
- [x] Endpoint en el servidor que emite tokens de LiveKit.
- [x] Cliente se une a la sala LiveKit al entrar.
- [x] Volumen de cada participante en función de la distancia (0 más allá de ~8 m).
- [x] Botones mic/cámara; video opcional en un panel pequeño.
- **Hecho cuando**: al alejarte de otro usuario dejas de oírlo gradualmente. (spec 005 cerrada el 2026-11-18 con validación manual aprobada por delegación; pendiente probar con LiveKit real, filas V1–V16)

### Fase 5: Pulido y modelado propio
- [ ] Sala modelada en Blender, exportada GLB comprimido (Draco), < 5 MB.
- [ ] Animación idle/walk del avatar (Mixamo o simple).
- [ ] README con instrucciones de arranque y variables de entorno.
- **Hecho cuando**: un tercero puede clonar, ejecutar y entrar en < 5 min.

### Backlog posterior al MVP
Múltiples salas, editor de mapas, auth, persistencia, avatares personalizables, zonas privadas (burbujas de audio), pruebas de carga.

## Convenciones (copiar a CLAUDE.md)
- TypeScript estricto; tipos de red solo en `shared/`.
- Servidor autoritativo sobre el estado; el cliente solo envía intención/posición.
- Sin dependencias nuevas sin anotarlas en "Decisiones".
- Cambios pequeños por fase; no avanzar de fase sin cumplir "Hecho cuando".
- Secretos solo en `.env` (nunca en el repo); mantener `.env.example`.
- Respuestas breves: no reexplicar decisiones ya cerradas aquí.

## Estado actual (actualizar al terminar cada sesión)
- Fecha: 2026-11-10
- Fase en curso: Fase 3 cerrada (spec 004 `Implemented`); siguiente, Fase 4 (spec 005, audio/video por proximidad)
- Modelo en uso: Opus 5.5
- Último logro: spec 004 cerrada (T1–T19): chat de sala por mensajes (validación, ritmo 5/5 s, autor y hora fijados por el servidor, historial de 20 en memoria), panel plegable con no leídos, avisos de llegada/salida, burbuja sobre el avatar y teclado que no mueve el avatar al escribir. Validación manual aprobada el 2026-11-10. `npm run build` y `npm test` pasan (241 pruebas).
- Bloqueos: ninguno
- Siguiente paso concreto: `/sdd-spec` de la spec 005 (Fase 4, audio/video por proximidad con LiveKit)

## Decisiones (agregar al tomar nuevas)
- 2026-10-17: stack fijado según tabla superior.
- 2026-10-21: se trabajará con Opus 5.5 como modelo principal; ver "Modelo por fase".
- 2026-10-22 (spec 001): Vitest como runner de pruebas. Dependencias de la fase 0: `typescript`, `vitest`, `tsx`, `@types/node` (raíz); `concurrently` (raíz), `@colyseus/core` y `@colyseus/ws-transport` (server; no el meta-paquete `colyseus`, que arrastra `uWebSockets.js` desde git); `@colyseus/testing`, `@colyseus/sdk` y `@colyseus/tools` (server, dev; peers de testing); `react`, `react-dom`, `@colyseus/sdk` (cliente; en Colyseus 0.18 sustituye a `colyseus.js`), `vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom` (cliente, dev).
- 2026-10-22 (spec 001): se cambia el gestor de paquetes de pnpm a **npm workspaces** a petición del humano: pnpm (Windows, invocado desde WSL) creaba enlaces simbólicos de WSL que Windows no resolvía. Reemplaza la fila "Monorepo" de la tabla de stack. Consecuencias: `shared` se enlaza con `"@office/shared": "*"`; `concurrently` (dev, raíz) levanta client y server en paralelo porque npm no tiene modo paralelo; se eliminan `pnpm-workspace.yaml` y `pnpm-lock.yaml`.
- 2026-10-22 (spec 001): Node mínimo 20.12 (`process.loadEnvFile` sustituye a `dotenv`); puertos por defecto 2567 (servidor) y 5173 (cliente).
- 2026-10-23 (spec 001): Vite con `strictPort: true` en 5173: si el puerto está ocupado, falla en lugar de saltar a otro (el cliente debe estar siempre en el puerto por defecto). Al pasar, `concurrently` también detiene el servidor; liberar el puerto y relanzar.
- 2026-10-22 (spec 001): entorno: el proyecto vive en `C:\Users\Judith.Paco\AdvancedProject` y se instala/ejecuta desde una terminal nativa de Windows. No ejecutar `npm install` desde WSL en este árbol: `node` en WSL es un enlace a `node.exe` y se crearían enlaces simbólicos de WSL que Windows no resuelve. Si pasa, borrar `node_modules` y reinstalar desde Windows.

- 2026-10-27 (spec 002): dependencias de la Fase 1 en `client/`: `three` (0.186), `@react-three/fiber` (9.8); dev: `@types/three`. `@react-three/drei` se descartó en la implementación (sin usos: todo sale de primitivas de three); se reevalúa en la Fase 5. `zustand` se difiere a la spec 003 (en la Fase 1 no hay estado compartido entre componentes: el movimiento vive en refs por fotograma). Medidas del mundo y colisión AABB (`shared/world.ts`) se ponen en `shared/` para que el servidor las use como autoridad en la spec 003.
- 2026-11-02 (spec 003): dependencias de la Fase 2: `@colyseus/schema` ^5 en `shared/` (el schema de la sala es un tipo de red; antes solo llegaba como dependencia par de core/sdk) y `zustand` ^5 en `client/` (estado de la sesión y lista de participantes). Instalar con `npm install` desde Windows.
- 2026-11-04 (spec 003): los avatares chocan entre sí (cambio pedido en validación). El cliente frena contra la posición interpolada de los demás; el servidor coloca al que entra en el hueco libre más cercano a SPAWN y solo rechaza solapes claros (centros a < 1 radio y acercándose) para que la latencia no cause correcciones. Sin dependencias nuevas.
- 2026-11-10 (spec 004): chat por mensajes de sala (no por el schema), historial de 20 en memoria en el servidor y avisos de llegada/salida emitidos por el servidor. Cambia la regla de la spec 003 «llegadas y salidas solo en consola»: ahora también aparecen en el panel. Sin dependencias nuevas.
- 2026-11-18 (spec 005): dependencias de la Fase 4: `livekit-server-sdk` 2.19.2 (server, firma del acceso) y `livekit-client` 2.23.0 (client); se eligen versiones con más de dos semanas publicadas. El acceso a LiveKit se pide por mensaje de sala (`avAccess`), no por endpoint HTTP: solo lo obtiene quien está dentro y el servidor fija identidad (`sessionId`) y nombre. LiveKit local en Docker (`livekit/livekit-server --dev`) para desarrollo; variables `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. Sin ellas el servidor arranca con la voz desactivada.

## Metodología
Cada fase se ejecuta como una spec SDD (`specs/NNN-nombre/`) con el flujo de `CLAUDE.md`:
`sdd-spec > sdd-clarify > sdd-plan > sdd-implement > [sdd-validate-impl] > sdd-verify`.
Mapa: spec 001 = Fase 0, 002 = Fase 1, 003 = Fase 2, 004 = Fase 3, 005 = Fase 4, 006 = Fase 5.

## Prompt de retoma para otro modelo
> Lee PLAN.md y CLAUDE.md. Revisa "Estado actual", continúa con el siguiente paso
> sin rediscutir decisiones cerradas, y al terminar actualiza "Estado actual" y marca las casillas.


## Modelo por fase
Modelo principal del proyecto: **Opus 5.5** (`claude-opus-5-5`). La columna "Alternativa
económica" es opcional si quieres ahorrar tokens; la "Reservar el modelo más fuerte" marca
dónde el razonamiento extra vale más.

| Fase | Opus 5.5 (principal) | Alternativa económica | Nota |
|---|---|---|---|
| 0 Esqueleto | Sí, en una sola sesión | Haiku 5.5 o Sonnet 5.5 | Tarea mecánica (workspaces, scripts, CLAUDE.md) |
| 1 Escena y movimiento | Sí | Sonnet 5.5 | Colisiones AABB y cámara requieren cuidado, pero son acotadas |
| 2 Multijugador | **Sí (recomendado)** | Sonnet 5.5 | Schema Colyseus, interpolación y servidor autoritativo: errores sutiles |
| 3 Chat | Sí | Haiku 5.5 o Sonnet 5.5 | Poca lógica, CRUD de mensajes + UI |
| 4 Audio/video por proximidad | **Sí (imprescindible)** | Sonnet 5.5 solo para UI de botones | Tokens LiveKit, audio espacial, sincronía con posiciones |
| 5 Pulido y modelado | **Sí** para integrar GLB/Draco y animaciones | Sonnet 5.5 para README y limpieza | La integración del modelo propio es lo más delicado |

Uso de Fable 5.1 (`claude-fable-5-1`): opcional, solo si Opus se atasca en un bug de Fase 2 o 4.

Consejos:
1. Dile a Opus: "Lee PLAN.md y ejecuta la Fase N". No pidas varias fases a la vez.
2. Al terminar cada sesión, pídele que actualice "Estado actual" y marque casillas.
3. Cambiar de modelo entre fases es seguro: este archivo es el traspaso.