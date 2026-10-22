# 001 · Esqueleto del proyecto

- **Estado:** Approved
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
- Gestor de paquetes: pnpm. Versión mínima de Node: 20 LTS.
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
- 2026-10-21 · ¿Vitest en esta spec? → Sí; se anota en Decisiones de `PLAN.md` y en `plan.md`.
- 2026-10-21 · ¿Puertos por defecto? → servidor 2567, cliente 5173.
- 2026-10-21 · ¿Versión mínima de Node? → Node 20 LTS o superior.
- 2026-10-21 · ¿Reconexión automática? → Diferida; se mantiene fuera de alcance (AC-6 exige recargar la página).

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|

## Validation log
