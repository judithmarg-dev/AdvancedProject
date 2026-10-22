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
| Monorepo | pnpm workspaces: `client/`, `server/`, `shared/` | Tipos compartidos |

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
- [ ] Monorepo con workspaces, TS configurado, `pnpm run dev` levanta client y server.
- [ ] Crear CLAUDE.md con las convenciones de abajo.
- **Hecho cuando**: la página carga y el cliente se conecta al servidor (log en consola).

### Fase 1: Escena y movimiento local
- [ ] Canvas R3F con luces, suelo y una sala (empezar con cajas; luego GLB propio).
- [ ] Avatar (cápsula) controlado con WASD.
- [ ] Cámara tercera persona que sigue al avatar.
- [ ] Colisiones simples con paredes (límites AABB, sin motor de física).
- **Hecho cuando**: caminas por la sala sin atravesar paredes a 60 fps.

### Fase 2: Multijugador
- [ ] `OfficeRoom` en Colyseus con schema `Player {id, name, x, z, rotY, color}`.
- [ ] Cliente envía posición (~10-15 Hz); interpola la de los demás.
- [ ] Pantalla de entrada con nombre; etiqueta flotante sobre cada avatar.
- [ ] Alta/baja de jugadores limpia.
- **Hecho cuando**: dos pestañas se ven moverse entre sí con fluidez.

### Fase 3: Chat
- [ ] Mensajes por sala, panel UI, burbuja corta sobre el avatar.
- **Hecho cuando**: un mensaje en una pestaña aparece en la otra.

### Fase 4: Audio/video por proximidad
- [ ] Endpoint en el servidor que emite tokens de LiveKit.
- [ ] Cliente se une a la sala LiveKit al entrar.
- [ ] Volumen de cada participante en función de la distancia (0 más allá de ~8 m).
- [ ] Botones mic/cámara; video opcional en un panel pequeño.
- **Hecho cuando**: al alejarte de otro usuario dejas de oírlo gradualmente.

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
- Fecha: 2026-10-21
- Fase en curso: Fase 0 (sin iniciar)
- Modelo en uso: Opus 5.5
- Último logro: plan creado y asignación de modelo por fase
- Bloqueos: ninguno
- Siguiente paso concreto: crear monorepo y scripts de desarrollo

## Decisiones (agregar al tomar nuevas)
- 2026-10-17: stack fijado según tabla superior.
- 2026-10-21: se trabajará con Opus 5.5 como modelo principal; ver "Modelo por fase".

## Metodología
Cada fase se ejecuta como una spec SDD (`specs/NNN-nombre/`) con el flujo de `CLAUDE.md`:
`sdd-spec > sdd-clarify > sdd-plan > sdd-implement > [sdd-validate-impl] > sdd-verify`.
Mapa: spec 001 = Fase 0, 002 = Fase 1, 003 = Fase 2, 004 = Fase 3, 005 = Fase 4, 006 = Fase 5.
Decisión pendiente para la spec 001: instalar Vitest como runner de pruebas.

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