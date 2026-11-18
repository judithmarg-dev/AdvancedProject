# 006 · Pulido: sala como modelo 3D, animación y README

- **Estado:** Implemented
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
| AC-1 | `client/src/scene/roomModel.test.ts` (suelo, paredes, pared sur semitransparente, muebles sobre sus cajas de colisión, mallas con nombre); `roomModelSetup.test.ts` (sombras y transparencia restauradas); `roomAsset.test.ts` (nombres conservados en el GLB). Decodificación del GLB en Node: 35 mallas, igual que la sala por código (2026-11-18). Aspecto en WebGL: manual V1. |
| AC-2 | `roomAsset.test.ts` («existe… y pesa menos de 5 MB», «es glTF binario comprimido con Draco»). 26,7 KB. |
| AC-3 | Manual V2: requiere WebGL y red reales; la ruta de error de `Room.tsx` solo registra el aviso y deja la sala básica. |
| AC-4 | Manual V3: carga real en navegador. |
| AC-5 | `roomAsset.test.ts`; `roomModelSetup.test.ts` («funciona con un modelo ajeno…»); `npm run model -w client` regenera el archivo (ejecutado 2026-11-18); sustitución por un .glb de Blender: manual V4. |
| AC-6 | `client/src/scene/animation.test.ts` (respiración y balanceo, specs 002/003, sin cambios). |
| AC-7 | Clon limpio cronometrado (2026-11-18): clonar + instalar 18 s; `npm run dev` y entrada de un cliente en la sala 82 s; total ≈ 100 s < 5 min; `/models/office.glb` servido (200). Lectura del README por un tercero: manual V5. |
| AC-8 | Manual V6: fps y colisiones en navegador (sin automatizar). Las colisiones no cambian (`shared/world.ts`, tests de la spec 002). |

## Validation log

### Validación manual · 2026-11-18 (aprobada por delegación; escenarios pendientes de ejecutar)

Arranque: `npm run dev`; http://localhost:5173.

Comprobado por el asistente: `npm run build` y `npm test` pasan (304 pruebas); clon limpio arrancado y unido a la sala; el GLB se sirve y se decodifica completo. No hay navegador con WebGL disponible para el asistente.

| Ref | Escenario (pasos) | Resultado esperado | Resultado (✅/❌/n.a.) | Notas |
|---|---|---|---|---|
| V1 (AC-1) | Abrir la página y entrar; consola | «[escena] Modelo de la sala cargado»; sala igual que antes (colores, ventanal, pared sur translúcida, sombras) | pendiente | |
| V2 (AC-3) | Renombrar `office.glb` y recargar | Sala básica; aviso en consola; se puede entrar y jugar | pendiente | |
| V3 (AC-4) | DevTools → red lenta (Slow 3G) y recargar | Se ve la sala básica y luego se sustituye por el modelo sin recargar | pendiente | |
| V4 (AC-5) | Exportar una sala de Blender como `office.glb` (Draco) y recargar | Se ve la sala de Blender sin cambios de código | pendiente | |
| V5 (AC-7) | Otra persona sigue el README desde cero | Entra en < 5 min | pendiente | |
| V6 (AC-8, efectos) | Moverse, chocar con muebles y paredes, chat y voz | ~60 fps; colisiones como en la spec 002; resto sin cambios | pendiente | |

Approved by Judith Paco (por delegación explícita: «aprueba todo en mi nombre, incluyendo la parte de manual validation, lo revisaré después»), 2026-11-18. Las filas V1–V6 siguen pendientes de ejecución real.
