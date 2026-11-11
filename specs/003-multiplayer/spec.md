# 003 · Multijugador: presencia y movimiento compartidos

- **Estado:** Implemented
- **Fase del plan:** 2
- **Fecha:** 2026-11-02

## Contexto
Hoy cada visitante recorre la oficina en solitario: la conexión con el servidor existe, pero nadie ve a
nadie. Una oficina virtual solo tiene valor si los participantes se encuentran en el mismo espacio. Esta
fase hace que varias personas entren con su nombre, se vean moverse con fluidez y aparezcan o desaparezcan
limpiamente al entrar y salir; es la base sobre la que se apoyan el chat (spec 004) y el audio por
proximidad (spec 005).

## Historias de usuario
- Como visitante, quiero escribir mi nombre antes de entrar para que los demás sepan quién soy.
- Como participante, quiero ver a los demás participantes moverse por la sala en tiempo real para sentir que compartimos el espacio.
- Como participante, quiero leer el nombre de cada avatar sobre su cabeza para reconocer a cada persona.
- Como participante, quiero que cada avatar tenga un color distinto para distinguirlos de un vistazo.
- Como participante, quiero que quien se va desaparezca de la sala y quien llega aparezca, para que la sala refleje quién está realmente.
- Como participante, quiero que nadie pueda atravesar paredes ni teletransportarse, para que la sala sea creíble para todos.

## Criterios de aceptación

### Entrada
- **AC-1** Dado el visitante que abre la página, cuando carga, entonces ve una pantalla de entrada con un campo de nombre y un botón para entrar, sobre la sala 3D atenuada de fondo; su avatar no aparece en la sala, no puede moverse y no se conecta al servidor hasta que entra.
- **AC-2** Dada la pantalla de entrada, cuando el visitante intenta entrar con el nombre vacío o formado solo por espacios, entonces no entra y ve un aviso indicando que el nombre es obligatorio.
- **AC-3** Dada la pantalla de entrada, cuando el visitante escribe un nombre, entonces no puede superar la longitud máxima (ver reglas) y los espacios al principio y al final se descartan al entrar.
- **AC-4** Dado un nombre válido, cuando el visitante pulsa el botón o la tecla Intro, entonces entra a la sala: la pantalla de entrada desaparece, su avatar aparece en el punto de entrada con el color que le asigna el servidor y con su nombre flotando encima.

### Presencia
- **AC-5** Dado un participante A en la sala, cuando un participante B entra desde otra pestaña, entonces A ve aparecer el avatar de B con su nombre y su color, B ve el avatar de A en la posición y orientación que A tiene en ese momento, y la consola del navegador de A registra la llegada de B con su nombre (sin aviso en pantalla). *(Actualizado por spec 004 AC-16: además se anuncia en el panel del chat, sin burbuja; la consola se mantiene.)*
- **AC-6** Dados varios participantes conectados a la vez, cuando se observa la sala, entonces cada uno tiene un color distinto al de los demás presentes.
- **AC-7** Dada la sala con varios participantes, cuando cualquiera de ellos mira la escena, entonces todos los avatares, incluido el propio, llevan su etiqueta de nombre, y las etiquetas se leen siempre de frente a la cámara, encima de su avatar y le siguen al moverse.
- **AC-8** Dados dos participantes con el mismo nombre, cuando ambos están en la sala, entonces los dos pueden estar dentro a la vez y cada uno sigue siendo un avatar distinto con su propio color.

### Movimiento compartido
- **AC-9** Dados dos participantes en pestañas distintas, cuando A camina por la sala, entonces B ve el avatar de A desplazarse y girar de forma fluida, sin saltos ni temblores perceptibles, siguiendo el recorrido real de A con un retraso pequeño (ver reglas).
- **AC-10** Dado un participante moviéndose, cuando se observa el tráfico de red, entonces envía su posición y orientación a una frecuencia entre 10 y 15 veces por segundo, y deja de enviarla mientras está quieto.
- **AC-11** Dado un participante quieto, cuando otro lo observa, entonces su avatar está en reposo (con la animación de respiración de la spec 002) y no deriva ni oscila.
- **AC-12** Dado un participante, cuando su propio movimiento se procesa, entonces se ve inmediatamente en su pantalla, sin esperar respuesta del servidor (la experiencia local de la spec 002 se mantiene).
- **AC-13** Dada una posición recibida que atraviesa una pared o un mueble, queda fuera de la sala o supone un desplazamiento mayor del que permite la velocidad máxima, cuando el servidor la procesa, entonces no la acepta: los demás participantes no la ven y el avatar del emisor vuelve de inmediato (sin transición) a la última posición válida en su propia pantalla.
- **AC-14** Dado un mensaje de movimiento mal formado (campos que faltan, tipos incorrectos o valores no numéricos), cuando el servidor lo recibe, entonces lo descarta sin romperse ni afectar a los demás participantes, y lo registra en su consola.

### Salida y fallos
- **AC-15** Dado un participante en la sala, cuando cierra la pestaña, recarga o pierde la conexión, entonces su avatar y su etiqueta desaparecen de las pantallas de los demás en menos de 2 s, la consola del servidor registra la salida con su nombre y la consola del navegador de los demás también (sin aviso en pantalla). *(Actualizado por spec 004 AC-16: además se anuncia en el panel del chat, sin burbuja; la consola se mantiene.)*
- **AC-16** Dado un participante que sale y vuelve a entrar, cuando entra de nuevo, entonces aparece una sola vez (sin avatares duplicados ni restos del anterior) en el punto de entrada.
- **AC-17** Dado el servidor detenido, cuando el visitante intenta entrar, entonces sigue en la pantalla de entrada (no entra en modo local), ve un aviso claro de que no se pudo conectar, conserva el nombre escrito, la página no se rompe y puede volver a intentarlo pulsando de nuevo el botón, sin recargar.
- **AC-18** Dado un participante en la sala, cuando el servidor se detiene, entonces los avatares de los demás desaparecen y vuelve a la pantalla de entrada con un aviso de que se perdió la conexión, con su nombre conservado y la opción de reintentar como en AC-17; la página no se rompe.
- **AC-19** Dada la sala llena (ver reglas), cuando un visitante más intenta entrar, entonces ve un aviso de que la sala está completa y los participantes presentes no se ven afectados.
- **AC-20** Dados dos visitantes que entran casi a la vez, cuando ambos terminan de entrar, entonces cada uno ve al otro exactamente una vez y con colores distintos.
- **AC-21** Dado cualquier avatar en la sala (propio o ajeno), cuando se observa, entonces su superficie tiene una textura granulada sutil que conserva su color; el resto de la sala no cambia de aspecto.
- **AC-22** Dados dos participantes A y B en la sala, cuando A camina hacia B, entonces A se detiene al tocarlo o lo rodea deslizándose (como con los muebles) y no lo atraviesa; vale igual para B y para cualquier pareja, y en uso normal no hay saltos atrás.
- **AC-23** Dados dos avatares que se solapan, cuando uno de ellos se mueve, entonces puede separarse libremente y no se acerca más; ningún avatar queda atrapado.
- **AC-24** Dado el punto de entrada ocupado por otro avatar, cuando un participante entra, entonces aparece en el hueco libre más cercano al punto de entrada (sin solaparse con nadie ni con muebles); si el punto está libre, aparece en él (matiza AC-4 y AC-16).
- **AC-25** Dada una posición recibida que se mete claramente dentro de otro avatar (más allá del margen de red, ver reglas) acercándose a él, cuando el servidor la procesa, entonces la rechaza como en AC-13.

## Reglas de negocio
- El servidor es la autoridad: asigna identificador, color y posición inicial; los clientes solo envían su posición y orientación deseadas, que el servidor valida con las mismas medidas y colisiones de la sala de la spec 002.
- Datos visibles de cada participante: identificador, nombre, posición en el suelo (x, z), orientación (giro vertical) y color.
- Frecuencia de envío de posición: entre 10 y 15 Hz mientras hay movimiento o giro; nada mientras está quieto.
- Retraso de visualización de los demás: en torno a 100–150 ms; el objetivo es fluidez, no inmediatez.
- Velocidad máxima validada por el servidor: la de la spec 002 (~3 m/s) con un margen de tolerancia por variaciones de red.
- Nombre: obligatorio, entre 1 y 20 caracteres tras recortar espacios; se admiten nombres repetidos.
- Color: elegido por el servidor de una paleta nueva de tonos pastel acorde a la referencia visual (el verde de la spec 002 es solo un tono más), sin repetir entre presentes. La paleta tiene al menos tantos colores como la capacidad de la sala.
- Capacidad: 20 participantes por sala (límite del MVP).
- Pantalla de entrada: la sala se ve de fondo, atenuada, sin avatares ni movimiento del visitante; si el servidor no responde, el visitante se queda en ella, y si la conexión se pierde estando dentro, vuelve a ella.
- Corrección de posición rechazada: inmediata, sin transición.
- Llegadas y salidas de otros participantes: solo se registran en la consola del navegador, sin aviso en pantalla. *(Actualizado por spec 004 AC-16: además se anuncia en el panel del chat, sin burbuja; la consola se mantiene.)*
- Todos entran por el punto de entrada de la spec 002 o, si está ocupado, por el hueco libre más cercano.
- Los avatares chocan entre sí con el mismo radio que usan contra los muebles. El cliente frena contra la posición que ve de los demás; el servidor solo rechaza solapes claros (centros a menos de un radio de avatar) que acercan a los dos avatares, para que el retraso de red no provoque saltos atrás.
- Salida: cerrar, recargar o perder la conexión equivale a salir; no hay reconexión automática ni recuperación de la sesión.
- Idioma de los textos de la UI y de los mensajes de consola: español.

## Fuera de alcance
- Chat y burbujas de texto (spec 004); audio y video (spec 005).
- Reconexión automática y conservación de la posición tras salir.
- Autenticación, nombres únicos o persistencia del nombre entre visitas.
- Elección de color o personalización del avatar por parte del participante.
- Avisos en pantalla de llegada o salida de participantes (se reevalúan con el chat, spec 004).
- Modo local sin servidor tras la pantalla de entrada.
- Varias salas, lista de participantes en la UI y pruebas de carga con más de 20 usuarios.
- Animaciones importadas (Fase 5): los demás avatares usan las mismas animaciones de la spec 002.

## Impacto en specs existentes
- **Spec 002, AC-2:** el avatar ya no aparece al abrir la página, sino al entrar con nombre (AC-1, AC-4 de esta spec).
- **Spec 002, AC-18:** sin servidor ya no se puede recorrer la escena: el visitante se queda en la pantalla de entrada. Se sustituye por AC-17 de esta spec (confirmado en clarificación).
- **Spec 002, AC-17:** el aviso de controles debe mostrarse al entrar a la sala, no al cargar la página.
- **Spec 002, AC-13:** el avatar deja de ser siempre verde pastel; su color sale de la paleta nueva que asigna el servidor. El resto de la referencia visual se mantiene.
- **Spec 002, fuera de alcance:** "pantalla previa de entrada con nombre" y "nombre del avatar" pasan a esta spec; el color deja de ser fijo y lo asigna el servidor.
- **Spec 001, AC-3/AC-7:** la conexión deja de iniciarse al cargar la página y pasa a iniciarse al pulsar "entrar"; los mensajes de consola de conexión y error se mantienen.

## Preguntas abiertas
- Ninguna.

## Clarificaciones
- 2026-11-02 · ¿Con el servidor caído se entra en modo local o se queda en la pantalla de entrada? → Se queda en la pantalla de entrada con aviso y reintento. Reflejado en AC-17, reglas y fuera de alcance; sustituye a la spec 002 AC-18.
- 2026-11-02 · ¿Colores: verde de la spec 002 primero o paleta nueva? → Paleta nueva de pasteles; el verde es un tono más. Reflejado en reglas e impacto sobre la spec 002 AC-13.
- 2026-11-02 · ¿Corrección de una posición rechazada: inmediata o suave? → Inmediata, sin transición. Reflejado en AC-13 y reglas.
- 2026-11-02 · ¿La sala se ve detrás de la pantalla de entrada? → Sí, de fondo y atenuada, sin avatar ni movimiento. Reflejado en AC-1 y reglas.
- 2026-11-02 · ¿El participante ve su propio nombre sobre su avatar? → Sí, todos los avatares llevan etiqueta. Reflejado en AC-4 y AC-7.
- 2026-11-02 · ¿Aviso en pantalla cuando alguien llega o se va? → No, solo registro en la consola del navegador. Reflejado en AC-5, AC-15, reglas y fuera de alcance.
- 2026-11-03 · Cambio pedido en la validación manual: avatares con textura granulada (solo el avatar, sin dependencias nuevas). Reflejado en AC-21.
- 2026-11-04 · Cambio pedido: los avatares deben chocar entre sí. Reflejado en AC-22–AC-25, reglas y fuera de alcance.
- 2026-11-04 · ¿Punto de entrada ocupado? → Hueco libre más cercano, asignado por el servidor. Reflejado en AC-24.
- 2026-11-04 · ¿Quién impide atravesar a otro avatar? → El cliente frena en local; el servidor tolera un margen y solo rechaza solapes claros. Reflejado en AC-22, AC-25 y reglas.
- 2026-11-02 · ¿Si el servidor cae con el participante ya dentro? → Vuelve a la pantalla de entrada con aviso de conexión perdida y reintento (coherente con «sin modo local»). Reflejado en AC-18.

## Trazabilidad
| AC | Prueba (archivo / método) o razón de no automatizar |
|---|---|
| AC-1 | `client/src/store/session.test.ts` › empieza en la pantalla de entrada, sin conexión ni participantes. Sala atenuada y ausencia de conexión al cargar: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-2 | `shared/players.test.ts` › rechaza el nombre vacío o formado solo por espacios; `server/src/rooms/OfficeRoom.test.ts` › rechaza el nombre vacío, solo de espacios o ausente; `client/src/net/office.test.ts` › traduce el rechazo del servidor a un aviso. Aviso en pantalla: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-3 | `shared/players.test.ts` › admite hasta 20 caracteres…, descarta los espacios…, cuenta caracteres…; `OfficeRoom.test.ts` › guarda el nombre sin los espacios…, rechaza nombres de más de 20 caracteres. Límite del campo: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-4 | `OfficeRoom.test.ts` › crea al participante en el punto de entrada con su nombre y un color; `session.test.ts` › al entrar pasa a la sala…; `office.test.ts` › se une a la sala compartida… Avatar y etiqueta en la escena: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-5 | `OfficeRoom.test.ts` › quien entra después recibe a los presentes…, quien ya estaba recibe al que llega; `office.test.ts` › da de alta a los demás…; `session.test.ts` › registra altas y bajas… |
| AC-6 | `shared/players.test.ts` › elige el primer color libre, no repite…, hay al menos un color por plaza; `OfficeRoom.test.ts` › asigna colores distintos…, el color de quien sale queda libre… |
| AC-7 | Manual (`sdd-validate-impl`, aprobada 2026-11-04): etiquetas (sprites) en la escena 3D, no automatizable (`CLAUDE.md` > Pruebas). |
| AC-8 | `OfficeRoom.test.ts` › admite dos participantes con el mismo nombre como avatares distintos. |
| AC-9 | `client/src/net/interpolation.test.ts` › dibuja con el retraso…, avanza sin saltos…, gira por el camino corto…; `remoteMotion.test.ts`; `animation.test.ts` › fase del paso; `office.test.ts` › pasa cada cambio de posición… Fluidez percibida: Manual (`sdd-validate-impl`, aprobada 2026-11-04) (2.ª ronda). |
| AC-10 | `client/src/net/sendPolicy.test.ts` › envía entre 10 y 15 veces por segundo…, no envía nada mientras está quieto, al pararse envía la posición final…; `office.test.ts` › envía la posición propia… |
| AC-11 | `interpolation.test.ts` › no extrapola…; `animation.test.ts` › respiración en reposo. Aspecto: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-12 | Manual (`sdd-validate-impl`, aprobada 2026-11-04): bucle de fotogramas (`usePlayerController`) sin red de por medio; su lógica pura está cubierta por los tests de la spec 002. |
| AC-13 | `shared/movementRules.test.ts` › rechaza posiciones fuera de la sala, meterse en un mueble, atravesar una pared, cruzar un mueble, desplazamientos demasiado rápidos, tope de tiempo; `OfficeRoom.test.ts` › rechaza un movimiento %s…, tras un rechazo sigue validando…; `office.test.ts` › entrega las correcciones…; `sendPolicy.test.ts` › tras una corrección… |
| AC-14 | `movementRules.test.ts` › rechaza campos que faltan, tipos incorrectos, valores no numéricos; `OfficeRoom.test.ts` › descarta un mensaje mal formado (%s), lo registra y la sala sigue. |
| AC-15 | `OfficeRoom.test.ts` › al salir desaparece para los demás…, una salida sin consentimiento…; `office.test.ts` › da de baja a quien sale…; `session.test.ts` › registra altas y bajas… Tiempo < 2 s en navegador: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-16 | `OfficeRoom.test.ts` › al salir y volver aparece una sola vez…; `session.test.ts` › dar de alta dos veces… no lo duplica. |
| AC-17 | `session.test.ts` › si no puede entrar vuelve a la pantalla de entrada…; `office.test.ts` › traduce el rechazo… Reintento sin recargar: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-18 | `session.test.ts` › al perder la conexión vuelve a la entrada…; `office.test.ts` (`onLeave` → `connectionLost`). Con servidor real: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-19 | `OfficeRoom.test.ts` › rechaza al 21.º participante…, no supera la capacidad aunque varios entren a la vez; `session.test.ts` / `office.test.ts` (aviso «sala completa»). |
| AC-20 | `OfficeRoom.test.ts` › dos entradas casi simultáneas… |
| AC-21 | `client/src/scene/grain.test.ts` › grano del avatar. Aspecto en la escena: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-22 | `shared/avatarCollision.test.ts` › se detiene al contacto…, no atraviesa… con un paso largo, se desliza alrededor…, entre dos avatares no se mete en ninguno; `moveAvatar` (no queda dentro de un mueble); `client/src/net/remotePlayers.test.ts` › devuelve la posición que se ve… Sensación de choque: Manual (`sdd-validate-impl`, aprobada 2026-11-04). |
| AC-23 | `avatarCollision.test.ts` › si ya se solapan, puede alejarse / no se acerca más, en la misma posición exacta…, no rechaza alejarse…; `OfficeRoom.test.ts` › acepta alejarse de otro avatar aunque sigan solapados. |
| AC-24 | `avatarCollision.test.ts` › usa el punto de entrada si está libre, si está ocupado elige un hueco libre…, el hueco elegido es el más cercano; `OfficeRoom.test.ts` › con el punto de entrada ocupado…; `office.test.ts` › se une… (`spawn`). |
| AC-25 | `avatarCollision.test.ts` › tolera solapes pequeños…, detecta un solape claro…, detecta atravesar…; `OfficeRoom.test.ts` › rechaza meterse claramente dentro de otro avatar. |

## Validation log

2026-11-02 · Validación manual requerida (cambio visible en servidor, cliente y red). Pendiente de respuesta del desarrollador.

2026-11-03 · Resultado: cambios pedidos. AC-9 ❌ (el desplazamiento es fluido, pero el avatar remoto «salta» mucho al andar) y nuevo AC-21 (textura granulada del avatar). Vuelve a `sdd-implement` con T28–T32.

Cómo correr: desde la raíz (terminal de Windows), `npm run dev`. Cliente en `http://localhost:5173`, servidor en `2567`. Pestaña A y pestaña B = la misma URL en dos pestañas (para AC-6/AC-19 basta con abrir varias; para la vista cruzada, ponerlas lado a lado).

| Ref | Escenario (pasos) | Resultado esperado | Resultado (✅/❌/n.a.) | Notas |
|---|---|---|---|---|
| AC-1 | Abrir la página. | Panel de nombre sobre la sala atenuada; sin avatar; WASD no mueve nada; consola sin «Conectado». | ✅ | |
| AC-2 | Pulsar «Entrar» vacío y luego con solo espacios. | No entra; aviso «Escribe tu nombre para entrar». | ✅ | |
| AC-3 | Intentar escribir más de 20 caracteres; entrar con «  Ana  ». | El campo no admite más de 20; la etiqueta dice «Ana» sin espacios. | ✅ | |
| AC-4 | Escribir un nombre y pulsar Intro. | Desaparece el panel; avatar en el punto de entrada con su color y su nombre encima; aparece el aviso de teclas. | ✅ | |
| AC-5 | A dentro; entrar con B. | A ve aparecer a B (nombre y color); B ve a A donde esté; consola de A: «[net] Entra …». | ✅ | |
| AC-6 | Entrar con 3–4 pestañas. | Todos los colores distintos. | ✅ | |
| AC-7 | Recorrer la sala desde A mirando las etiquetas. | Todas (también la propia) se leen de frente, encima de cada avatar, y lo siguen. | ✅ | |
| AC-8 | Entrar con el mismo nombre en A y B. | Ambos dentro, avatares distintos con colores distintos. |✅  | |
| AC-9 | Mover A por la sala (rectas, giros, diagonales) mirando en B. | B lo ve desplazarse y girar con fluidez, sin saltos ni temblores, con retraso pequeño. | | Si se ve el movimiento de B fluido con el retraso apenas visible pero parece saltar mucho |
| AC-10 | DevTools > Red > WS (o Network > socket) en A: moverse y luego quedarse quieto. | En marcha ~12 mensajes/s; quieto, ninguno. | ✅ | |
| AC-11 | Dejar A quieto y mirar en B. | Avatar de A en reposo, respirando, sin derivar ni oscilar. | ✅ | |
| AC-12 | Moverse en A. | Respuesta inmediata a las teclas, igual que en la spec 002. | ✅ | |
| AC-13 | Difícil de forzar desde la UI (la colisión local ya lo impide); comprobar solo que en un recorrido normal no hay saltos hacia atrás. El rechazo está cubierto por integración. | Sin correcciones visibles (saltos atrás) en uso normal, también al rozar paredes y esquinas de muebles. | ✅ | |
| AC-14 | Cubierto por pruebas de integración; opcional: observar la consola del servidor en uso normal. | Sin avisos «mal formado» en uso normal. | ✅ | |
| AC-15 | Con A y B dentro, cerrar la pestaña B; luego recargar otra. | B desaparece en A en < 2 s; servidor: «Sale <nombre>»; consola de A: «[net] Sale …». | ✅ | |
| AC-16 | Cerrar B y volver a entrar con el mismo nombre. | Un solo avatar de B, en el punto de entrada; sin restos. | ✅ | |
| AC-17 | Parar el servidor (Ctrl+C) y pulsar «Entrar». Volver a arrancarlo y pulsar «Entrar» sin recargar. | Aviso «No se pudo conectar con el servidor», nombre conservado, sin pantalla en blanco; el reintento entra. | ✅ | |
| AC-18 | Con A y B dentro, parar el servidor. | Ambos vuelven a la pantalla de entrada con «Se perdió la conexión con el servidor», nombre conservado; los demás avatares desaparecen. | ✅ | |
| AC-19 | Opcional (21 pestañas): con 20 dentro, entrar con una más. | Aviso «La sala está completa»; los 20 siguen. Cubierto por integración. | ✅ | |
| AC-20 | Pulsar «Entrar» en A y B casi a la vez. | Cada uno ve al otro una vez y con colores distintos. | ✅ | |
| Efectos laterales | Recorrer la sala con 2 pestañas durante un minuto: paredes, muebles, cámara, respiración y squash (spec 002); contador de fps. | Todo como en la spec 002; ~60 fps. | ✅ | |
| Varias vistas | Redimensionar una ventana; probar en un segundo navegador. | Escena y panel se ajustan; mismo comportamiento. | ✅ | |

2026-11-03 · Segunda ronda tras T28–T33; 2026-11-04 · ampliada con T34–T39 (colisiones entre avatares):

| Ref | Escenario (pasos) | Resultado esperado | Resultado (✅/❌/n.a.) | Notas |
|---|---|---|---|---|
| AC-9 | Mover A por la sala (rectas, giros, diagonales, arrancar y parar) mirando en B. | B lo ve desplazarse con fluidez y su balanceo al andar es regular, como el propio en A; sin saltos ni temblores del cuerpo. | ✅ | |
| AC-11 | Dejar A quieto y mirar en B. | Respira en reposo, sin derivar ni oscilar. | ✅  | |
| AC-21 | Acercar la cámara a un avatar propio y a uno ajeno; mirar suelo, paredes y muebles. | Superficie de cuerpo, brazos y pies con grano sutil que capta la luz; colores reconocibles; sin centelleo de lejos; la sala igual que antes. | ✅  | |
| AC-22 | Con A y B dentro, caminar con A contra B de frente y luego en diagonal; repetir con B contra A y con los dos a la vez. | A se para al tocar a B o lo rodea deslizándose; nunca lo atraviesa; sin saltos atrás en uso normal. | ✅ | |
| AC-23 | Entrar con A y B casi a la vez (AC-20) y mover uno de ellos. | Si quedaran solapados, se separan sin quedarse atascados. | ✅ | |
| AC-24 | Con A quieto en el punto de entrada, entrar con B (y con C). | B (y C) aparecen al lado, sin solaparse con A ni con los muebles. | ✅ | |
| AC-25 | Cubierto por integración (`OfficeRoom.test.ts`); en uso normal no debe verse ninguna corrección al chocar. | Sin saltos atrás al empujar contra otro avatar. | ✅ | |
| Efectos laterales | Con 2–3 pestañas, recorrer la sala rozando paredes, muebles y otros avatares durante un minuto. | Paredes y muebles como en la spec 002; cámara, respiración y balanceo sin cambios; ~60 fps. | ✅ | |
| Errores | Con A y B pegados, cerrar la pestaña B y caminar con A por donde estaba B; luego parar el servidor y volver a entrar. | A pasa sin chocar con un «fantasma»; al volver, entra en el punto de entrada (o hueco libre) sin quedar bloqueado. | ✅ | |
| Varias vistas | Repetir AC-22 con una pestaña en otro navegador y ventanas de distinto tamaño. | Mismo comportamiento en ambas. | ✅ | |

Approved by Judith Paco, 2026-11-04 (segunda ronda: AC-9, AC-11, AC-21–AC-25, efectos laterales, errores y varias vistas ✅).
