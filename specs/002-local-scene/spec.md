# 002 · Escena local, avatar y movimiento

- **Estado:** Implemented
- **Fase del plan:** 1
- **Fecha:** 2026-10-26

## Contexto
Hoy el cliente solo abre una página en blanco que se conecta al servidor. Para que la oficina virtual
tenga sentido, el visitante necesita ver un espacio y moverse por él. Esta fase entrega la experiencia
de un solo usuario (escena, avatar y cámara) sobre la que luego se añadirán los demás participantes.

## Historias de usuario
- Como visitante, quiero ver una oficina luminosa en 3D al abrir la página para entender dónde estoy.
- Como participante, quiero mover mi avatar con el teclado para recorrer la sala.
- Como participante, quiero que la cámara siga a mi avatar para no perderlo de vista.
- Como participante, quiero que las paredes me detengan para que el recorrido resulte creíble.
- Como participante, quiero que mi avatar tenga vida propia (se mueva al respirar y reaccione al andar) para que el espacio se sienta amable.

## Criterios de aceptación
- **AC-1** Dado el cliente en ejecución, cuando el visitante abre la página, entonces ve una sala 3D cerrada con suelo, cuatro paredes y al menos un hueco de ventanal, iluminada de forma clara y sin errores en la consola.
- **AC-2** Dada la escena cargada, cuando el visitante la observa, entonces hay un avatar con forma de cápsula redondeada situado en el punto de entrada de la sala.
- **AC-3** Dada la escena cargada, cuando el participante mantiene pulsada una de las teclas de avance, retroceso, izquierda o derecha, entonces el avatar se desplaza de forma continua en esa dirección, relativa a la orientación de la cámara.
- **AC-4** Dado el avatar en movimiento, cuando el participante suelta las teclas, entonces el avatar se detiene en pocos instantes sin deslizamiento perceptible.
- **AC-5** Dado el avatar en movimiento, cuando el participante pulsa dos teclas de dirección a la vez, entonces el avatar avanza en diagonal a la misma velocidad máxima que en línea recta.
- **AC-6** Dado el avatar en movimiento, cuando cambia de dirección, entonces el avatar gira suavemente con todo el cuerpo (cara incluida) hasta mirar hacia donde avanza, de modo que al alejarse de la cámara se le ve de espaldas.
- **AC-7** Dada la escena en ejecución, cuando el avatar se desplaza, entonces la cámara lo sigue por detrás y por encima, manteniéndolo siempre visible y sin saltos bruscos.
- **AC-8** Dado el avatar junto a una pared, cuando el participante intenta avanzar contra ella, entonces el avatar se detiene en el contacto y no la atraviesa ni sale de la sala.
- **AC-9** Dado el avatar avanzando en diagonal contra una pared, cuando colisiona, entonces conserva el componente de movimiento paralelo a la pared (se desliza) en lugar de quedarse completamente bloqueado.
- **AC-10** Dado el mobiliario de la sala (al menos un escritorio con silla, un mueble bajo y una planta), cuando el avatar avanza contra cualquiera de esas piezas, entonces se detiene igual que con una pared.
- **AC-11** Dado el avatar quieto, cuando el participante no pulsa ninguna tecla, entonces el avatar presenta una animación de reposo perceptible y suave (ligero movimiento vertical, a modo de respiración).
- **AC-12** Dado el avatar, cuando empieza a moverse y cuando se detiene, entonces muestra una deformación elástica breve (estirarse y comprimirse) y, al caminar, un balanceo acorde a la velocidad.
- **AC-13** Dada la escena cargada, cuando el participante la observa, entonces el aspecto sigue la referencia visual acordada: avatar verde pastel brillante con cara simple (dos ojos y boca curva), paredes y suelo en tonos crema, acentos verde salvia y luz natural entrando por el ventanal.
- **AC-14** Dada la escena en una máquina de desarrollo estándar, cuando el participante recorre la sala durante un minuto, entonces la aplicación se mantiene en torno a 60 fps sin caídas sostenidas.
- **AC-15** Dado el foco del teclado fuera del lienzo 3D (por ejemplo en otro elemento de la página) o la ventana en segundo plano, cuando el participante vuelve a la escena, entonces el avatar no conserva movimiento residual de teclas que ya no están pulsadas.
- **AC-16** Dada la pestaña del navegador redimensionada, cuando cambia el tamaño de la ventana, entonces la escena se ajusta sin deformar la imagen.
- **AC-17** Dada la escena recién cargada, cuando el visitante entra, entonces aparece durante unos segundos un aviso discreto con las teclas de control que después se desvanece y no vuelve a mostrarse en esa sesión.
- **AC-18** Dado el servidor detenido, cuando el visitante abre la página, entonces la escena se muestra y es recorrible igualmente (el movimiento local no depende del servidor), y la consola sigue informando del fallo de conexión como en la spec 001.

## Reglas de negocio
- Sala rectangular cerrada de aproximadamente 16 × 12 metros, con el avatar entrando cerca de uno de sus lados.
- Avatar de aproximadamente 1 metro de alto y 0,7 metros de ancho (proporción redondeada, no humanoide).
- Velocidad de desplazamiento: ~3 m/s; aceleración y frenado cortos (menos de 0,2 s).
- Giro del avatar: interpolado, completando un giro de 180° en menos de 0,3 s.
- Cámara en tercera persona a ~6 m por detrás y ~4 m por encima del avatar, con seguimiento suavizado; sin control de cámara por ratón en esta fase.
- Las colisiones se resuelven por volúmenes rectangulares alineados a los ejes; sin motor de física, sin gravedad ni salto (el avatar siempre está en el suelo).
- Teclas de movimiento: W/A/S/D y las flechas del cursor, equivalentes entre sí.
- Movimiento puramente local: esta fase no envía ni recibe posición del servidor.
- Mobiliario de la sala: piezas sencillas con la paleta de la referencia (escritorio con silla junto al ventanal, mueble bajo con estantes, plantas); modelado detallado y GLB propio quedan para la Fase 5.
- El avatar gira con el cuerpo: no hay reorientación de la cara hacia la cámara.
- Aviso de controles: visible al entrar, se desvanece a los ~5 s, una sola vez por sesión.
- Medición de los 60 fps: comprobación manual con el contador de fotogramas del navegador durante el recorrido.
- Referencia visual: `shared/assets/Multimedia.jpeg` (estilo suave y luminoso, materiales mate-brillantes, paleta crema + verde salvia).
- Idioma de los mensajes de consola: español.

## Fuera de alcance
- Sincronización de posición con el servidor y otros avatares (spec 003).
- Chat (spec 004) y audio/video por proximidad (spec 005).
- Modelo GLB propio de la sala y animaciones importadas (Fase 5): en esta fase la sala se construye con geometría simple.
- Control de cámara con ratón, zoom, colisión de cámara con paredes y vista en primera persona.
- Personalización del avatar (color, nombre, accesorios).
- Pantalla previa de entrada con nombre (spec 003).
- Soporte táctil o mando; controles solo de teclado.
- Gravedad, salto, rampas o varios niveles de altura.

## Impacto en specs existentes
Spec 001: ninguno de sus AC cambia. La conexión al servidor (AC-3 de la 001) se mantiene y convive con la
escena; la escena no debe impedir que la página cargue si el servidor está caído (ver AC-18 y 001 AC-7).

## Preguntas abiertas
- Ninguna.

## Clarificaciones
- 2026-10-26 · ¿Mobiliario ya en la Fase 1? → Sí, mobiliario simple con primitivas y la paleta de la referencia (escritorio, silla, mueble bajo, plantas). Se concreta en AC-10 y en las reglas de negocio.
- 2026-10-26 · ¿La cara del avatar mira siempre a la cámara? → No: el avatar gira con el cuerpo y puede quedar de espaldas. Reflejado en AC-6.
- 2026-10-26 · ¿Pantalla de entrada con nombre en esta fase? → No, llega con la spec 003; en la Fase 1 se entra directo a la escena (ya estaba fuera de alcance).
- 2026-10-26 · ¿Medidas y velocidad? → Confirmadas tal cual: sala 16 × 12 m, avatar ~1 m, 3 m/s, cámara 6 m detrás y 4 m arriba.
- 2026-10-26 · ¿Ayuda de teclas en pantalla? → Sí, aviso discreto al entrar que se desvanece. Nuevo AC-17 (el antiguo AC-17 pasa a AC-18).

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|
| AC-1 | Manual (`sdd-validate-impl`): la escena 3D y la consola del navegador no se automatizan (`CLAUDE.md` > Pruebas). Construida en `client/src/scene/Room.tsx` y `Lighting.tsx`. |
| AC-2 | Manual (validación 2026-10-27, filas «AC-2 (T21)» y «AC-2 (T24)»): avatar visible al cargar tras hacer traslúcido el muro sur y punto de entrada libre. Automatizado en parte: `shared/world.test.ts` > "coloca el punto de entrada dentro de la sala y libre de obstáculos". Forma y carita: `client/src/scene/Avatar.tsx`, criterio visual. |
| AC-3 | `client/src/scene/input.test.ts` > "avanza hacia delante con W y con la flecha arriba", "cubre las cuatro direcciones", "mantiene la dirección mientras la tecla sigue pulsada"; `movement.test.ts` > "acelera hasta la velocidad máxima y no la supera". Manual: recorrido real. |
| AC-4 | `client/src/scene/movement.test.ts` > "se detiene por completo en menos de 0,2 s al soltar las teclas (AC-4)" y "no invierte la marcha al frenar". |
| AC-5 | `client/src/scene/input.test.ts` > "normaliza la diagonal: misma velocidad que en línea recta (AC-5)"; `movement.test.ts` > "mantiene la velocidad máxima en diagonal". |
| AC-6 | `client/src/scene/movement.test.ts` > "convierte la dirección en el ángulo al que mira el avatar", "toma siempre el camino corto", "completa un giro de 180° en menos de 0,3 s", "gira progresivamente". La cara es hija del cuerpo en `Avatar.tsx`, así que gira con él. Las expectativas izquierda/derecha del test estaban invertidas respecto al convenio de `rotation.y` de three.js; corregidas en T25. |
| AC-7 | `client/src/scene/camera.test.ts` (6 pruebas: desfase 6/4, convergencia, sin saltos, sin sobrepasar, avatar por delante, independencia de la tasa de fotogramas). Manual: encuadre real. |
| AC-8 | `shared/world.test.ts` > "detiene al avatar en contacto con la pared este/oeste/norte/sur" (la caja de la pared este estaba invertida; corregido en T23). Manual: validación 2026-10-27, filas AC-8. |
| AC-9 | `shared/world.test.ts` > "conserva el componente paralelo a la pared" y "permite salir de una esquina deslizando por la pared". Manual: validación 2026-10-27, fila AC-9 (diagonal contra la pared este). |
| AC-10 | `shared/world.test.ts` > "detiene el avance contra cada pieza de mobiliario", "define al menos escritorio, silla, mueble bajo y una planta", "ninguna pieza de mobiliario se sale de la sala". Los muebles se dibujan sobre esas mismas cajas (`Room.tsx`). |
| AC-11 | `client/src/scene/animation.test.ts` > "es periódica", "sube y baja alrededor de la posición de reposo", "es un movimiento sutil, no un salto". Manual: percepción. |
| AC-12 | `client/src/scene/animation.test.ts` > bloques "balanceo al caminar" y "squash and stretch" (7 pruebas). Manual: percepción. |
| AC-13 | Manual: criterio visual contra `shared/assets/Multimedia.jpeg`; no automatizable. Paleta en `client/src/scene/palette.ts`; orientación del ventanal corregida en T22 y verificada en la validación 2026-10-27 (fila «AC-13 (T22)»). |
| AC-14 | Manual: medición con el contador de fotogramas del navegador durante un minuto. Mitigaciones: una sola luz con sombras, sin estado de React por fotograma, `dpr` limitado a 2. |
| AC-15 | `client/src/scene/input.test.ts` > "olvida las teclas al perder el foco (AC-15)", "olvida las teclas al ocultarse la pestaña (AC-15)", "deja de escuchar al liberarse". Además el paso de tiempo se limita a 1/20 s al volver de otra pestaña. |
| AC-16 | Manual: redimensionado real de la ventana (lo gestiona el lienzo de R3F); no automatizable sin navegador. |
| AC-17 | `client/src/ui/controlsHintState.test.ts` (5 pruebas: se muestra la primera vez, no reaparece, legible al entrar, se desvanece, desaparece a los 5 s). Manual: aspecto. |
| AC-18 | Manual: con el servidor parado, la escena carga y se recorre; la consola informa del fallo (spec 001 AC-7). La conexión vive en `main.tsx`, fuera del árbol de la escena. |

## Validation log

2026-10-27 · Validación manual (Judith Paco) · **Con cambios solicitados**.

| Ref | Escenario | Resultado esperado | Resultado | Notas |
|---|---|---|---|---|
| AC-1 | Abrir la página con la consola visible | Sala cerrada, 4 paredes, hueco de ventanal, luz clara, sin errores | ✅ | |
| AC-2 | Observar el avatar al cargar | Avatar cápsula visible en el punto de entrada | ❌ | La pared pintada con `PALETTE.wallTransparent` no es transparente: tapa al avatar al cargar la página. |
| AC-3 | W/A/S/D y flechas mantenidas | Desplazamiento continuo relativo a la cámara | ✅ | |
| AC-4 | Soltar las teclas en marcha | Parada inmediata sin deslizamiento | ✅ | |
| AC-5 | Dos teclas a la vez | Diagonal a la misma velocidad máxima | ✅ | |
| AC-6 | Cambios de dirección y alejarse de la cámara | Giro suave con el cuerpo, de espaldas | ✅ | |
| AC-7 | Recorrido de extremo a extremo | Cámara detrás y arriba, sin saltos | ✅ | |
| AC-8 | Avanzar contra las cuatro paredes | Se detiene en el contacto | ✅ | |
| AC-9 | Diagonal contra una pared | Desliza conservando el componente paralelo | ✅ | |
| AC-10 | Avanzar contra escritorio, silla, mueble y planta | Se detiene igual que con una pared | ✅ | |
| AC-11 | Avatar quieto | Respiración suave y perceptible | ✅ | |
| AC-12 | Arrancar, frenar y caminar | Squash and stretch y balanceo | ✅ | |
| AC-13 | Comparar con `shared/assets/Multimedia.jpeg` | Paleta y luz natural por el ventanal | ❌ | La luz/hueco del ventanal necesita rotar: se muestra con la misma orientación que la pared `wallTransparent` en lugar de la del muro este. |
| AC-14 | Recorrido de un minuto con el contador de fps | ~60 fps sin caídas | ✅ | |
| AC-15 | Perder el foco / cambiar de pestaña con una tecla pulsada | Sin movimiento residual al volver | ✅ | |
| AC-16 | Redimensionar la ventana | Escena ajustada sin deformar | ✅ | |
| AC-17 | Recargar y observar el aviso | Aviso de teclas que se desvanece y no reaparece | ✅ | |
| AC-18 | Servidor parado | Escena cargable y recorrible, consola informa del fallo | ✅ | |

Tareas abiertas a raíz de esta validación: T21 (AC-2) y T22 (AC-13). La spec sigue `In progress`.

2026-10-27 · Revalidación tras T21–T25 · **Aprobada**.

| Ref | Escenario | Resultado esperado | Resultado | Notas |
|---|---|---|---|---|
| AC-2 (T21) | Recargar y mirar el avatar al cargar | Muro sur traslúcido, avatar visible desde el primer fotograma | ✅ | |
| AC-2 (T24) | Observar el punto de entrada | Avatar libre, fuera del escritorio y de la silla | ✅ | |
| AC-13 (T22) | Mirar el ventanal de la pared este | Hueco de cielo alineado con el muro este | ✅ | |
| AC-13 | Comparar con `shared/assets/Multimedia.jpeg` | Paleta crema + salvia y luz natural por el ventanal | ✅ | |
| AC-8 (T23) | Avanzar contra la pared este | Detiene; ya no se sale de la sala por el este | ✅ | |
| AC-8 | Avanzar contra norte, sur y oeste | Siguen deteniendo | ✅ | |
| AC-9 | Diagonal contra la pared este | Desliza conservando el componente paralelo | ✅ | |
| AC-1 | Consola durante el recorrido | Sin errores | ✅ | |
| AC-6 | Movimiento a izquierda y derecha | Gira hacia donde avanza | ✅ | |
| AC-10 | Avanzar contra escritorio, silla, mueble y plantas | Se detiene en todas | ✅ | |
| AC-14 | Recorrido de un minuto con el contador de fps | ~60 fps, sin caídas por el muro traslúcido | ✅ | |
| AC-7 | Recorrido completo, también junto al muro sur | Cámara siguiendo sin saltos | ✅ | |
| AC-16 | Redimensionar la ventana | Escena ajustada sin deformar | ✅ | |
| AC-18 | Servidor parado | Escena cargable y recorrible, consola informa del fallo | ✅ | |

Approved by Judith Paco, 2026-10-27.
