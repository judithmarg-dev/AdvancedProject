# 004 · Chat de sala

- **Estado:** Implemented
- **Fase del plan:** 3
- **Fecha:** 2026-11-04

## Contexto
Los participantes ya se ven moverse por la oficina, pero no tienen forma de comunicarse: hasta que llegue el
audio por proximidad (spec 005), y también después para quien no tenga micrófono, el texto es el único canal.
Esta fase añade un chat compartido por toda la sala, con un panel donde leer y escribir, y una burbuja breve
sobre el avatar de quien habla para saber de un vistazo quién ha dicho qué en el espacio 3D.

## Historias de usuario
- Como participante, quiero escribir un mensaje y que lo lean todos los presentes para comunicarme sin micrófono.
- Como participante, quiero ver en un panel los mensajes con el nombre de su autor para seguir la conversación.
- Como participante, quiero ver una burbuja sobre el avatar de quien acaba de escribir para ubicar quién habla en la sala.
- Como participante, quiero poder escribir sin que mi avatar se mueva para no perderme por la sala al teclear.

## Criterios de aceptación

### Enviar y recibir
- **AC-1** Dado un participante dentro de la sala, cuando entra, entonces ve abajo a la izquierda un panel de chat con un campo para escribir y la lista con los últimos mensajes enviados antes de su llegada (como mucho 20, solo mensajes de participantes, sin avisos de llegada o salida); fuera de la sala (pantalla de entrada) el panel no aparece.
- **AC-2** Dados A y B en la sala, cuando A escribe un mensaje y lo envía (tecla Intro o botón), entonces el mensaje aparece en el panel de A y de B, con el nombre y el color de A y la hora de envío (HH:MM, en la hora local de quien lee), en menos de 1 s, y el campo de A queda vacío y listo para el siguiente.
- **AC-3** Dados varios mensajes enviados por distintos participantes, cuando se leen en el panel, entonces todos los participantes los ven en el mismo orden, el más reciente abajo, y el panel se desplaza solo para mostrar el último salvo que el participante esté leyendo mensajes anteriores.
- **AC-4** Dado un mensaje vacío o formado solo por espacios, cuando el participante intenta enviarlo, entonces no se envía y nadie lo recibe.
- **AC-5** Dado el campo de escritura, cuando el participante escribe, entonces no puede superar la longitud máxima (ver reglas); los espacios al principio y al final se descartan al enviar.
- **AC-6** Dado un mensaje que contiene texto con apariencia de código o marcado (por ejemplo etiquetas HTML), cuando se muestra en el panel o en la burbuja, entonces se ve tal cual como texto, sin interpretarse.

### Burbuja sobre el avatar
- **AC-7** Dados A y B en la sala, cuando A envía un mensaje, entonces sobre el avatar de A aparece una burbuja con el texto (recortado si es largo, ver reglas) que ven A y B, encima de la etiqueta de nombre, de frente a la cámara y siguiendo al avatar al moverse.
- **AC-8** Dada una burbuja visible, cuando pasa su tiempo de vida (ver reglas), entonces desaparece; si el mismo participante envía otro mensaje antes, la burbuja se sustituye por la nueva y su tiempo se reinicia.

### Teclado
- **AC-9** Dado el foco en el campo de escritura, cuando el participante pulsa teclas de movimiento (WASD o flechas), entonces se escriben en el campo y el avatar no se mueve; al salir del campo, el avatar no conserva movimiento residual (como spec 002 AC-15).
- **AC-10** Dado el participante moviéndose por la sala, cuando pulsa Intro, entonces el foco pasa al campo de escritura; cuando pulsa Escape en el campo, entonces el foco vuelve a la sala y puede moverse de nuevo.

### Panel y avisos
- **AC-16** Dados A y B en la sala, cuando entra o sale un participante C, entonces en el panel de A y de B aparece un aviso discreto («C ha entrado» / «C ha salido»), distinto visualmente de los mensajes, sin burbuja sobre ningún avatar; la consola del navegador lo sigue registrando (spec 003 AC-5, AC-15).
- **AC-17** Dado el panel desplegado, cuando el participante lo pliega, entonces queda solo un botón para desplegarlo; mientras está plegado, ese botón muestra el número de mensajes de participantes recibidos sin leer (los avisos de llegada o salida no cuentan) y las burbujas siguen apareciendo; al desplegarlo, el contador vuelve a cero.

### Servidor y errores
- **AC-11** Dado un mensaje recibido por el servidor, cuando lo procesa, entonces es el servidor quien fija el autor (nombre e identificador del emisor) y la hora; un cliente no puede enviar mensajes en nombre de otro.
- **AC-12** Dado un mensaje mal formado (no es texto, vacío tras recortar o más largo del máximo), cuando el servidor lo recibe, entonces lo descarta sin reenviarlo, lo registra en su consola y la sala sigue funcionando para todos.
- **AC-13** Dado un participante que envía mensajes más rápido del límite (ver reglas), cuando el servidor recibe los que exceden el límite, entonces los descarta y el emisor ve un aviso breve de que está enviando demasiado rápido; los demás no se ven afectados.
- **AC-14** Dado un participante que sale de la sala, cuando los demás miran el chat, entonces sus mensajes anteriores siguen en el panel y su burbuja desaparece junto con su avatar.
- **AC-15** Dado el servidor caído o la conexión perdida, cuando ocurre, entonces el comportamiento es el de spec 003 AC-18 (vuelta a la pantalla de entrada) y al volver a entrar el panel empieza de nuevo según AC-1 (con el historial que conserve el servidor).

## Reglas de negocio
- Alcance: un único chat para toda la sala; todos los presentes reciben todos los mensajes (sin proximidad ni privados).
- Longitud máxima del mensaje: 200 caracteres tras recortar espacios.
- Burbuja: muestra como mucho ~60 caracteres (con «…» si se recorta) y dura 5 s.
- Límite de envío: como máximo 5 mensajes cada 5 s por participante.
- El servidor es la autoridad: valida el texto, fija autor y hora, y difunde; el cliente solo envía el texto.
- Mensajes que se conservan en el panel de cada participante: los últimos 100 (mensajes y avisos) de su sesión.
- Historial al entrar: el servidor conserva en memoria los últimos 20 mensajes de participantes y los entrega a quien entra; los avisos de llegada o salida no forman parte del historial.
- Hora del mensaje: la fija el servidor; cada participante la ve en su hora local, formato HH:MM.
- Panel: abajo a la izquierda, semitransparente, plegable; el contador de no leídos solo cuenta mensajes de participantes.
- Llegadas y salidas: aviso de sistema en el panel (no en burbuja) además del registro en consola.
- Sin persistencia: al cerrar la página o al reiniciar el servidor el historial se pierde.
- Idioma de la UI y de la consola: español.

## Fuera de alcance
- Mensajes privados, chat por proximidad o por zonas.
- Persistencia del historial en base de datos, moderación, edición o borrado de mensajes.
- Emojis personalizados, adjuntos, enlaces enriquecidos y formato (negrita, menciones).
- Avisos de llegada o salida fuera del panel (notificaciones flotantes, sonidos).
- Indicador de «escribiendo…» y notificaciones del navegador.

## Impacto en specs existentes
- **Spec 002, AC-3/AC-15:** el teclado de movimiento deja de actuar mientras el foco está en el campo del chat (AC-9, AC-10).
- **Spec 003, AC-7:** encima de la etiqueta de nombre puede aparecer la burbuja de chat; la etiqueta se mantiene.
- **Spec 003, reglas y AC-5/AC-15 («llegadas y salidas solo en consola, sin aviso en pantalla»):** pasan a anunciarse también en el panel del chat (AC-16); la consola se mantiene.

## Preguntas abiertas
- Ninguna.

## Clarificaciones
- 2026-11-05 · ¿Quien entra ve mensajes anteriores? → Sí, los últimos 20 que conserva el servidor en memoria. Reflejado en AC-1, AC-15 y reglas.
- 2026-11-05 · ¿Se anuncian llegadas y salidas en el chat? → Sí, como aviso discreto en el panel, sin burbuja. Nuevo AC-16; cambia la regla de la spec 003.
- 2026-11-05 · ¿Posición del panel y si se pliega? → Abajo a la izquierda, plegable, con contador de no leídos. Nuevo AC-17 y reglas.
- 2026-11-05 · ¿Límites y hora? → Se confirman 200 / 60 caracteres, burbuja de 5 s, 5 mensajes cada 5 s, 100 en el panel; hora HH:MM visible. Reflejado en AC-2 y reglas.
- 2026-11-05 · ¿El historial al entrar incluye avisos? → No, solo mensajes de participantes. Reflejado en AC-1 y reglas.
- 2026-11-05 · ¿El contador de no leídos cuenta avisos? → No, solo mensajes de participantes. Reflejado en AC-17 y reglas.

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|
| AC-1 | `server/src/rooms/OfficeRoom.test.ts` («entrega a quien lo pide los últimos 20…», «con la sala recién creada el historial está vacío»); `client/src/store/chat.test.ts` («carga el historial al entrar…»); `client/src/net/office.test.ts` («al entrar vacía el chat y pide el historial», «entrega el historial…»). Panel solo en sala: manual V1, V17. |
| AC-2 | `OfficeRoom.test.ts` («difunde un mensaje a todos con autor, color, hora e id…»); `office.test.ts` («envía el texto…», «entrega cada mensaje con la hora local…»); `chatFormat.test.ts` (`formatTime`); `store/chat.test.ts` («añade los mensajes en orden de llegada»). Campo vacío tras enviar y <1 s: manual V2 (DOM/tiempo real). |
| AC-3 | `OfficeRoom.test.ts` («todos reciben los mensajes en el mismo orden y con ids crecientes»). Autodesplazamiento: manual V3 (scroll real). |
| AC-4 | `shared/chat.test.ts` («rechaza el mensaje vacío…»); manual V4. |
| AC-5 | `shared/chat.test.ts` («descarta los espacios…», «admite hasta 200…», «cuenta caracteres…»); manual V5. |
| AC-6 | Manual V6: sin DOM de pruebas en el proyecto; el panel usa nodos de texto de React. |
| AC-7 | `chatFormat.test.ts` (`bubbleText`); `store/chat.test.ts` («cada mensaje deja una burbuja…»). Sprite en escena: manual V7. |
| AC-8 | `store/chat.test.ts` («caduca a los 5 s», «un mensaje nuevo… la sustituye y reinicia el tiempo»); manual V8. |
| AC-9 | `client/src/scene/input.test.ts` («las teclas de movimiento pulsadas en un campo de texto no mueven…», «al entrar en un campo de texto olvida las teclas…»); manual V9. |
| AC-10 | Manual V10: foco e Intro/Escape en DOM real, sin automatizar. |
| AC-11 | `OfficeRoom.test.ts` (autor fijado por el servidor, campos falsos ignorados); `shared/chat.test.ts` («ignora campos de más…»); manual V13. |
| AC-12 | `shared/chat.test.ts` (`parseChatSend` mal formados); `OfficeRoom.test.ts` (descarte y sala sigue); manual V14. |
| AC-13 | `shared/chat.test.ts` (`allowChat`); `OfficeRoom.test.ts` («al superar 5 mensajes en 5 s descarta el exceso y avisa solo al emisor»); `store/chat.test.ts` («registra cuándo el servidor rechazó por ritmo»); `office.test.ts` («avisa cuando el servidor rechaza por ritmo»); aviso visible: manual V15. |
| AC-14 | `store/chat.test.ts` («al salir un participante conserva sus mensajes y borra su burbuja»); `OfficeRoom.test.ts` (historial con mensajes de quien salió); manual V16. |
| AC-15 | `office.test.ts` («al perder la conexión vacía el chat»); `store/chat.test.ts` («reset…»); servidor parado/reiniciado: manual V17. |
| AC-16 | `OfficeRoom.test.ts` («anuncia llegadas y salidas a los demás, no al propio participante»); `store/chat.test.ts` («los avisos no crean burbuja», «se añaden al panel»); `office.test.ts` (avisos al sink); manual V11. |
| AC-17 | `store/chat.test.ts` («plegado cuenta solo mensajes…», «al desplegar el contador vuelve a cero»); botón: manual V12. |

## Validation log

### Validación manual · 2026-11-10 (pendiente)

Arranque: `npm run dev`; pestaña A en la URL del cliente (p. ej. http://localhost:5173) y pestaña B (idealmente otro navegador) en la misma URL, con nombres distintos.

| Ref | Escenario (pasos) | Resultado esperado | Resultado (✅/❌/n.a.) | Notas |
|---|---|---|---|---|
| V1 (AC-1) | En la pantalla de entrada, mirar la esquina inferior izquierda; entrar con A | Sin panel en la entrada; dentro aparece el panel abajo a la izquierda con campo de texto | ✅ | |
| V2 (AC-2) | A envía «hola» con Intro; B envía «qué tal» con el botón | Ambos lo ven con nombre, color y hora HH:MM local en <1 s; el campo del emisor queda vacío | ✅ | |
| V3 (AC-3) | Intercambiar ~5 mensajes entre A y B; en A subir el scroll y B envía otro; volver abajo | Mismo orden en ambos, el último abajo; autodesplazamiento salvo si A lee mensajes anteriores | ✅ | |
| V4 (AC-4) | Intro con el campo vacío y con solo espacios | No se envía; B no recibe nada | ✅ | |
| V5 (AC-5) | Pegar un texto de 250 caracteres; enviar « hola » con espacios | El campo se limita a 200; se envía «hola» sin espacios | ✅ | |
| V6 (AC-6) | Enviar `<b>hola</b>` y `<img src=x onerror=alert(1)>` | Se ve literal en panel y burbuja; sin alert ni formato | ✅ | |
| V7 (AC-7) | A envía un mensaje; en B mover a A. Enviar uno de >60 caracteres | Burbuja sobre la etiqueta de A, de frente, sigue al avatar, visible para A y B; la larga termina en «…» | ✅ | |
| V8 (AC-8) | Esperar 5 s tras un mensaje; luego enviar dos seguidos antes de 5 s | La burbuja desaparece a los 5 s; el segundo sustituye al primero y reinicia el tiempo | ✅ | |
| V9 (AC-9) | Con foco en el campo, escribir «wasd» y pulsar flechas | Se escribe en el campo; el avatar no se mueve; al salir con Escape no hay movimiento residual | ✅ | |
| V10 (AC-10) | Moverse con WASD; Intro; escribir; Escape; moverse | Intro enfoca el campo; Escape devuelve el foco y vuelve el movimiento | ✅ | |
| V11 (AC-16) | B entra y luego sale (cerrar pestaña) con A mirando | Aviso «B ha entrado» / «B ha salido» en el panel de A, con estilo distinto, sin burbuja; consola con el registro; B no ve aviso de su propia entrada | ✅ | |
| V12 (AC-17) | A pliega el panel; B envía 3 mensajes; entra/sale C; A despliega | Solo queda un botón con contador 3 (los avisos no cuentan); las burbujas siguen saliendo; al desplegar vuelve a 0 | ✅ | |
| V13 (AC-11) | Comprobar que el nombre/color mostrado es siempre el del emisor real (con DevTools, enviar `room.send("chat", {text:"x", authorName:"Otro"})` si es posible) | Se muestra el nombre real del emisor | ✅ | |
| V14 (AC-12) | Con DevTools enviar `room.send("chat", 123)` y `{text:""}` | Servidor lo registra en consola y descarta; la sala sigue; B no recibe nada | ✅ | |
| V15 (AC-13) | A envía >5 mensajes en menos de 5 s | Los excedentes no llegan a B; A ve un aviso de «demasiado rápido»; B puede seguir escribiendo | ✅ | |
| V16 (AC-14) | B envía un mensaje y cierra la pestaña | El mensaje de B sigue en el panel de A; su burbuja desaparece con su avatar | ✅ | |
| V17 (AC-1, AC-15) | Entrar con C tras varios mensajes (>20 enviados); luego parar el servidor y reiniciarlo | C ve los últimos 20 sin avisos; al parar el servidor vuelve a la pantalla de entrada; al reentrar el panel arranca según AC-1 (historial vacío tras reinicio) | ✅ | |
| V18 (efectos) | Mover, chocar con avatares y mirar el HUD/FPS con el panel abierto | Movimiento, colisiones y avatares remotos como en spec 002/003; ~60 fps | ✅ | |
| V19 (vistas) | Redimensionar la ventana (estrecha/ancha); usar un segundo navegador | Panel legible y sin tapar la escena de forma inutilizable; comportamiento igual entre navegadores | ✅ | |
| V20 (errores) | Entrar con nombre vacío; cerrar pestaña a mitad de escribir | Se aplica el comportamiento de specs previas; sin errores en consola ni en el servidor | ✅ | |

Approved by Judith Paco, 2026-11-10 (V1–V20 marcadas ✅ por el desarrollador).
