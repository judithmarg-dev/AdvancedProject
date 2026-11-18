# 006 · Pulido: sala como modelo 3D, animación y README

- **Estado:** In progress
- **Fase del plan:** 5
- **Fecha:** 2026-11-18

## Contexto
La oficina ya funciona de punta a punta (movimiento, multijugador, chat, voz), pero la sala se dibuja con
primitivas en el código y no hay instrucciones para que otra persona la arranque. Esta fase convierte la sala
en un modelo 3D como archivo (que se puede editar en una herramienta de modelado y sustituir sin tocar código),
confirma la animación del avatar y documenta el arranque, para que el proyecto sirva de plantilla.

## Historias de usuario
- Como participante, quiero ver la oficina igual de cuidada y fluida que antes, cargada como modelo, para que la experiencia no empeore.
- Como autora de la plantilla, quiero sustituir el modelo de la sala por uno exportado de mi herramienta de modelado sin tocar código, para adaptar la oficina a otros usos.
- Como visitante técnico, quiero un README con los pasos de arranque para clonar, ejecutar y entrar en menos de 5 minutos.

## Criterios de aceptación
- **AC-1** Dado que la página carga, cuando el modelo de la sala está disponible, entonces la sala se muestra a partir de ese archivo (suelo, alfombra, paredes con ventanal y muebles) con las mismas medidas y posiciones que las zonas de colisión, la pared sur semitransparente y las sombras.
- **AC-2** Dado el archivo del modelo, cuando se mide, entonces está comprimido y pesa menos de 5 MB.
- **AC-3** Dado que el modelo no se puede cargar (falta o está dañado), cuando la página carga, entonces se ve la sala básica dibujada por código, la consola avisa del fallo y se puede entrar y jugar igual.
- **AC-4** Dado que el modelo aún se está descargando, cuando la página carga, entonces se ve la sala básica hasta que el modelo está listo y entonces se sustituye sin recargar.
- **AC-5** Dada la autora con un modelo exportado de su herramienta de modelado, cuando lo guarda con el nombre y la carpeta documentados, entonces la página lo usa sin cambios de código; y un comando documentado regenera el modelo por defecto desde las medidas de la sala.
- **AC-6** Dado un avatar, cuando está quieto respira y cuando anda se balancea al paso (animación simple de las specs 002 y 003, sin cambios).
- **AC-7** Dado un tercero con Node instalado, cuando sigue el README, entonces clona, instala, arranca y entra en la sala en menos de 5 minutos; el README documenta las variables de entorno y cómo activar la voz (opcional).
- **AC-8** Dada la sala cargada como modelo, cuando el participante se mueve, entonces el rendimiento se mantiene en ~60 fps y las colisiones funcionan como en la spec 002.

## Reglas de negocio
- Archivo del modelo: `client/public/models/office.glb`, glTF binario con compresión Draco, < 5 MB.
- Las colisiones siguen saliendo de las medidas de la sala (no del modelo): si la autora cambia la distribución de muebles en el modelo, debe actualizar también las medidas.
- Sin modelo, la sala básica es el respaldo; nunca se bloquea la entrada.
- Idioma del README: español.

## Fuera de alcance
- Personalización de avatares, animaciones esqueléticas (Mixamo) y editor de mapas.
- Colisiones leídas del modelo 3D.
- Modelado artístico en Blender: lo hace la autora; esta fase deja la cadena preparada (ver Clarificaciones).

## Impacto en specs existentes
- **Spec 002, AC-10 (sala y muebles):** la sala se dibuja desde el modelo cuando está disponible; las medidas y colisiones no cambian.

## Preguntas abiertas
- Ninguna.

## Clarificaciones
- 2026-11-18 · ¿Sala modelada en Blender? → Blender no está disponible en la máquina del asistente. Se genera un modelo equivalente desde las medidas de la sala con un comando y la autora lo sustituirá por su exportación de Blender con el mismo nombre (AC-5). Decidido por el asistente bajo la delegación de la autora; a revisar por ella.
- 2026-11-18 · ¿Animación idle/walk? → Se da por cumplida con la animación simple ya existente (respiración y balanceo, specs 002/003); Mixamo queda fuera de alcance.
- 2026-11-18 · Spec y plan aprobados por Judith Paco por delegación («aprueba todo en mi nombre»).

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|

## Validation log
