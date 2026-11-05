# 001 · Esqueleto del proyecto

- **Estado:** Implemented
- **Fase del plan:** 0
- **Fecha:** 2026-10-21

## Contexto
El proyecto aún no tiene código. Antes de construir la escena y el multijugador necesitamos una base
común donde cliente, servidor y tipos compartidos arranquen con un solo comando y se comuniquen.
Así las fases siguientes se apoyan en una conexión ya comprobada.

## Historias de usuario
- Como desarrollador, quiero levantar cliente y servidor con un solo comando para empezar a trabajar sin configuración manual.
- Como desarrollador, quiero que cliente y servidor compartan los mismos tipos para evitar desajustes en los mensajes de red.
- Como desarrollador, quiero ejecutar la compilación y las pruebas de todo el proyecto con un comando para validar cada cambio.
- Como visitante, quiero abrir la página y que se conecte al servidor para saber que la oficina está disponible.

## Criterios de aceptación
- **AC-1** Dado el repositorio recién clonado y las dependencias instaladas, cuando el desarrollador ejecuta el comando de desarrollo, entonces cliente y servidor arrancan a la vez y la consola de cada uno indica en qué dirección escuchan.
- **AC-2** Dado el cliente y el servidor en ejecución, cuando un visitante abre la página en el navegador, entonces la página carga sin errores en la consola.
- **AC-3** Dada la página cargada con el servidor activo, cuando el cliente inicia, entonces la consola del navegador muestra un mensaje de conexión exitosa al servidor.
- **AC-4** Dada la página cargada con el servidor activo, cuando el cliente se conecta, entonces la consola del servidor registra la conexión del cliente.
- **AC-5** Dada la página abierta y conectada, cuando el servidor se detiene, entonces la consola del navegador muestra un mensaje de desconexión y la página no se rompe.
- **AC-6** Dada la página abierta con el servidor detenido, cuando el servidor se vuelve a levantar y se recarga la página, entonces el cliente se conecta de nuevo (AC-3).
- **AC-7** Dado el servidor detenido, cuando un visitante abre la página, entonces la página carga y la consola muestra un error claro de que no se pudo conectar (sin pantalla en blanco).
- **AC-8** Dado el repositorio con dependencias instaladas, cuando el desarrollador ejecuta la compilación, entonces cliente, servidor y tipos compartidos compilan sin errores bajo verificación estricta de tipos.
- **AC-9** Dado el repositorio con dependencias instaladas, cuando el desarrollador ejecuta las pruebas, entonces se ejecutan las de todos los paquetes y pasan, incluida al menos una prueba por paquete que demuestre el entorno de pruebas operativo.
- **AC-10** Dado un tipo o constante definido en el paquete compartido, cuando se usa desde cliente y servidor, entonces ambos lo consumen del mismo origen y un cambio incompatible hace fallar la compilación.
- **AC-11** Dado el repositorio, cuando se revisan sus archivos, entonces existe un ejemplo de variables de entorno con todas las variables que el proyecto necesita y no hay secretos versionados.
- **AC-12** Dado el puerto del servidor ocupado, cuando el desarrollador ejecuta el comando de desarrollo, entonces el servidor informa del error de puerto en uso en lugar de fallar en silencio.

## Reglas de negocio
- Un solo comando de desarrollo levanta cliente y servidor; un solo comando compila todo; un solo comando corre todas las pruebas.
- Puertos por defecto: servidor 2567, cliente 5173; configurables por variable de entorno, y la dirección del servidor que usa el cliente también es configurable.
- Gestor de paquetes: npm (workspaces). Versión mínima de Node: 20 LTS.
- Vitest es el runner de pruebas del proyecto.
- El servidor acepta conexiones de cualquier cliente local en desarrollo; no hay autenticación ni nombre de usuario todavía.
- La conexión de esta fase no sincroniza estado de jugadores ni envía mensajes de juego: solo establece y cierra la sesión.
- Idioma de los mensajes de consola: español.
- `CLAUDE.md` ya existe con las convenciones del plan; la spec no lo vuelve a crear, solo se verifica que siga vigente.

## Fuera de alcance
- Escena 3D, avatar, cámara y colisiones (spec 002).
- Sala de juego, jugadores y sincronización de estado (spec 003).
- Chat (spec 004) y audio/video (spec 005).
- Reconexión automática del cliente.
- Despliegue, integración continua y contenedores.

## Impacto en specs existentes
Ninguno (es la primera spec).

## Preguntas abiertas
- Ninguna.

## Clarificaciones
- 2026-10-21 · ¿Gestor de paquetes? → pnpm (según `PLAN.md`); `CLAUDE.md` y los skills SDD se corrigen de npm a pnpm.
- 2026-10-22 · Cambio de gestor (a petición del humano, tras fallos de enlaces simbólicos de pnpm en Windows/WSL) → npm workspaces. Reemplaza la respuesta anterior; ningún AC cambia.
- 2026-10-21 · ¿Vitest en esta spec? → Sí; se anota en Decisiones de `PLAN.md` y en `plan.md`.
- 2026-10-21 · ¿Puertos por defecto? → servidor 2567, cliente 5173.
- 2026-10-21 · ¿Versión mínima de Node? → Node 20 LTS o superior.
- 2026-10-21 · ¿Reconexión automática? → Diferida; se mantiene fuera de alcance (AC-6 exige recargar la página).

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|
| AC-1 | `server/src/server.test.ts` > "informa en consola la dirección donde escucha (AC-1)" (log del servidor). Manual: Validation log AC-1 ✅ (`npm run dev`, procesos de larga vida y consola real). |
| AC-2 | Manual: Validation log AC-2 ✅. No automatizado: requiere navegador real. |
| AC-3 | `client/src/net/connect.test.ts` > "se une a la sala compartida y registra la conexión (AC-3)". Manual: Validation log AC-3 ✅. |
| AC-4 | `server/src/rooms/OfficeRoom.test.ts` > "registra en consola cuando un cliente se conecta (AC-4)". Manual: Validation log AC-4 ✅. |
| AC-5 | `connect.test.ts` > "registra la desconexión sin romper nada (AC-5)"; `OfficeRoom.test.ts` > "registra en consola cuando un cliente se desconecta (AC-5)". Manual: Validation log AC-5 ✅. |
| AC-6 | `server/src/server.test.ts` > "permite unirse, detenerse y volver a arrancar (AC-6)". Manual: Validation log AC-6 ✅. |
| AC-7 | `connect.test.ts` > "registra un error claro y no lanza si no puede conectar (AC-7)". Manual: Validation log AC-7 ✅ (página sin pantalla en blanco). |
| AC-8 | `npm run build` pasa en `shared`, `server` y `client` con `strict` (`tsconfig.base.json`); verificado en `sdd-verify` (2026-10-23). |
| AC-9 | `npm test` corre los tres paquetes: 14 pruebas (`shared/types.test.ts`, `shared/env.test.ts`, `server/src/rooms/OfficeRoom.test.ts`, `server/src/server.test.ts`, `client/src/net/connect.test.ts`). |
| AC-10 | `OfficeRoom.test.ts` > "registra la sala bajo el nombre compartido (AC-10)" y `shared/types.test.ts`; cliente (`connect.ts`) y servidor (`server.ts`, `config.ts`) importan de `@office/shared`. La rotura de compilación se comprobó a mano en T13 (el compilador no se automatiza). |
| AC-11 | `shared/env.test.ts` > ".env.example documenta todas las variables del proyecto" y ".env no se versiona". |
| AC-12 | `server/src/server.test.ts` > "rechaza con EADDRINUSE y lo informa si el puerto está ocupado (AC-12)" y "sale con código 1 e informa del puerto en uso al arrancar el proceso (AC-12)". Manual: Validation log AC-12 ✅. |

## Validation log
2026-10-22 · Validación manual requerida (cambio visible en cliente y servidor). Pendiente de respuesta del desarrollador.

Cómo correr: desde la raíz, `npm run dev`. Cliente en `http://localhost:5173`, servidor en `2567`. Para la segunda pestaña, abrir la misma URL.

| Ref | Escenario (pasos) | Resultado esperado | Resultado (✅/❌/n.a.) | Notas |
|---|---|---|---|---|
| AC-1 | Ejecutar `npm run dev` en la raíz. | Cliente y servidor arrancan a la vez; cada consola indica su dirección (5173 / 2567). |✅ | |
| AC-2 | Abrir `http://localhost:5173` con todo en marcha; abrir DevTools > Consola. | La página carga sin errores en la consola. |✅ | Manifest: Line: 1, column: 1, Syntax error.But everything works fine. |
| AC-3 | Recargar la página con el servidor activo. | La consola del navegador muestra el mensaje de conexión exitosa. | ✅ | |
| AC-4 | Mirar la consola del servidor al abrir la página. | El servidor registra la conexión del cliente. | ✅ | |
| AC-5 | Con la página conectada, detener el servidor (Ctrl+C solo del servidor, o matar su proceso). Cerrar también una pestaña con el servidor activo. | El navegador muestra el mensaje de desconexión y la página no se rompe. Al cerrar la pestaña, el servidor registra la salida. | ✅ | |
| AC-6 | Volver a levantar el servidor y recargar la página. | El cliente se conecta de nuevo (como AC-3). |✅ | |
| AC-7 | Con el servidor detenido, abrir la página. | La página carga (no queda en blanco) y la consola muestra un error claro de que no se pudo conectar. |✅  | |
| AC-12 | Con el puerto 2567 ocupado (otra terminal con el servidor corriendo), ejecutar el servidor otra vez. | Informa "puerto en uso" y sale con error; no falla en silencio. | ✅ | |
| Efectos laterales | Revisar que la página no muestre advertencias nuevas ni consumo anormal. | Sin errores extra; no hay fases previas que probar. | ✅ | |
| Varias vistas | Abrir dos pestañas (o un segundo navegador) a la vez. | Ambas se conectan; el servidor registra dos conexiones y dos salidas al cerrarlas. | ✅ | |

Approved by Judith Paco, 2026-10-23

## Modificaciones posteriores
- 2026-11-04 · Spec 003: AC-3/AC-7 — la conexión se inicia al pulsar «Entrar», no al cargar la página; los mensajes de consola se mantienen. Ver «Impacto en specs existentes» de `specs/003-multiplayer/spec.md`.
