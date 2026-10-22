# CLAUDE.md

Oficina virtual 3D multijugador (estilo Gather Town). Léelo junto con `PLAN.md` (stack, fases,
estado actual). Las decisiones cerradas de `PLAN.md` no se rediscuten.

## Flujo SDD (Spec Driven Development)

Cada fase de `PLAN.md` (o cada cambio funcional) es una spec en `specs/NNN-nombre/`.
No se escribe código sin spec aprobada y plan aprobado.

```
sdd-spec > sdd-clarify > sdd-plan > sdd-implement > [sdd-validate-impl] > sdd-verify
                                          ^                  |
                                          └── change request ┘
```

| Paso | Skill | Entrega | Estado de la spec al salir |
|---|---|---|---|
| 1 | `/sdd-spec` | `spec.md` (qué y por qué) | Draft |
| 2 | `/sdd-clarify` | respuestas registradas en la spec | Draft (el humano la pasa a Approved) |
| 3 | `/sdd-plan` | `plan.md` + `tasks.md` | In progress (al aprobar el humano el plan) |
| 4 | `/sdd-implement` | código + tests, tareas marcadas | In progress |
| 5 | `/sdd-validate-impl` | validación manual del humano (solo si hay cambio visible: cliente, escena, UI o flujo de red) | In progress |
| 6 | `/sdd-verify` | matriz de trazabilidad, informe | Implemented |

Reglas del flujo:
- Solo el humano pasa una spec a `Approved`, aprueba el plan y aprueba la validación manual.
- Si en `sdd-implement` aparece un caso no definido: parar, proponer un `AC-n` nuevo y esperar aprobación.
- Si `sdd-validate-impl` recibe cambios o fallos, vuelve a `sdd-implement` con tareas nuevas o reabiertas.
- Si no hay cambio visible (config, docs, solo tipos), `sdd-validate-impl` se omite y registra el motivo.
- Al cerrar una spec, actualizar "Estado actual" y las casillas de `PLAN.md`.
- Índice de specs y plantillas: `specs/README.md`, `specs/_templates/`.

## Estructura

```
shared/  types.ts       # PlayerState, mensajes, constantes (único lugar de tipos de red)
server/  src/rooms/OfficeRoom.ts, src/index.ts   # Colyseus + endpoint de tokens LiveKit
client/  src/{scene,net,ui,store}/, public/models/
specs/   NNN-nombre/{spec,plan,tasks}.md
```

Capas para el plan: `shared` → `server` → `client` (de dentro hacia fuera).

## Constitución (el plan la verifica artículo por artículo)

- **I.** La spec dice qué y por qué, nunca cómo.
- **II.** Servidor autoritativo sobre el estado; el cliente solo envía intención/posición.
- **III.** Tipos de red solo en `shared/`; TypeScript estricto, sin `any` en red.
- **IV.** Test primero cuando la tarea lo pide; verlo fallar por la razón correcta.
- **V.** Sin dependencias nuevas sin anotarlas en "Decisiones" de `PLAN.md` y en la `plan.md`.
- **VI.** Secretos solo en `.env` (nunca en el repo); mantener `.env.example`.
- **VII.** Cambios pequeños; no avanzar de fase sin cumplir su "Hecho cuando".

## Pruebas

- Runner: Vitest (se instala en la spec 001 y se anota como decisión). `pnpm test` corre todos los workspaces.
- Lógica pura (colisiones AABB, interpolación, volumen por distancia) → test unitario en `shared/` o `client/`.
- Salas Colyseus → test de integración en `server/` con el cliente de `@colyseus/testing`.
- Escena 3D, cámara, audio real y video → no se automatizan: se cubren en `sdd-validate-impl` y se anota el motivo en la trazabilidad.
- Cada `AC-n` debe tener test automatizado o una razón escrita de por qué no.

## Definición de hecho (por spec)

- [ ] `pnpm run build` y `pnpm test` pasan.
- [ ] Todas las tareas `[x]`; cada `AC-n` con test o razón registrada.
- [ ] "Hecho cuando" de la fase en `PLAN.md` cumplido.
- [ ] Sin deriva entre spec y código; constitución respetada.
- [ ] `.env.example` al día si hubo variables nuevas.
- [ ] `PLAN.md` actualizado (estado actual, casillas, decisiones).

## Estilo de trabajo

- Respuestas breves; no reexplicar decisiones ya cerradas.
- Specs y docs en español; carpetas y código en inglés.
- Commits: `feat(NNN): T3 descripción corta`.
- Comandos: `pnpm run dev` (client + server), `pnpm run build`, `pnpm test`.
