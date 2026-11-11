# Plan · 004 Chat de sala

## Enfoque
El chat viaja por **mensajes de sala**, no por el schema: es efímero y no hace falta sincronizar estado. El
cliente solo envía el texto; el servidor lo valida (longitud, ritmo), le pone autor, color, hora e
identificador, lo guarda en un historial en memoria (últimos 20) y lo difunde a todos. El servidor también
anuncia llegadas y salidas a los demás. En el cliente, un store de chat (zustand, ya en el stack) guarda las
entradas del panel, los no leídos y la última burbuja de cada participante; el panel es React (texto plano,
nunca HTML) y la burbuja es un sprite como la etiqueta de nombre. El teclado de movimiento ignora las teclas
cuando el foco está en un campo de texto.

## Cambios por capa

### shared
- `shared/chat.ts` (nuevo, reexportado desde `types.ts`):
  - `CHAT = { maxLength: 200, bubbleChars: 60, bubbleMs: 5000, rateCount: 5, rateWindowMs: 5000, historySize: 20, panelSize: 100 } as const`.
  - `normalizeChatText(raw: unknown): string | null`: texto recortado de 1–200 caracteres (contados como en
    `normalizeName`, por puntos de código); si no, `null`.
  - `parseChatSend(raw: unknown): ChatSend | null`: objeto `{ text }` con texto válido.
  - `allowChat(recent: readonly number[], now: number): boolean`: ventana deslizante (≤ 5 en 5 s).
- `shared/types.ts`:
  - `MSG` gana `chat` (C→S), `chatMessage` (S→todos), `chatHistory` (C→S petición vacía / S→C respuesta),
    `chatNotice` (S→demás), `chatRejected` (S→emisor).
  - `type ChatSend = { text: string }`.
  - `type ChatMessage = { id: number; authorId: string; authorName: string; authorColor: string; text: string; sentAt: number }`.
  - `type ChatNotice = { kind: "joined" | "left"; name: string; sentAt: number }`.
  - `type ChatRejected = { reason: "rateLimited" }`.

### server
- `OfficeRoom`:
  - `onMessage(MSG.chat)`: ignora si el emisor no es participante; `parseChatSend` → si `null`, `console.warn`
    y descarta (AC-12); `allowChat` sobre las horas recientes del emisor → si no, `client.send(chatRejected)`
    (AC-13); si pasa, crea `ChatMessage` con datos del `Player` del emisor, `sentAt = Date.now()` e `id`
    creciente, lo añade al historial (recorta a 20) y `broadcast(MSG.chatMessage)` (AC-2, AC-3, AC-11).
  - `onMessage(MSG.chatHistory)`: responde al que pide con el historial (AC-1, AC-15).
  - `onJoin`: `broadcast(MSG.chatNotice, { kind: "joined", … }, { except: client })`; `onLeave`: aviso
    `left` a los que quedan y borra sus horas de envío (AC-16).

### client
- `net/office.ts`: `OfficeSession.sendChat(text)`; tras unirse registra los manejadores de chat y pide el
  historial; parsea defensivamente cada payload entrante y lo entrega al sink (`chatHistory`,
  `chatMessage`, `chatNotice`, `chatRejected`). Al perder la conexión, el sink vacía el chat (AC-15).
- `store/chat.ts` (nuevo, zustand): `entries` (mensajes y avisos, máx. 100), `collapsed`, `unread` (solo
  mensajes, solo plegado), `rateLimitedAt`, `bubbles: Record<authorId, { text; expiresAt }>`; acciones
  `history`, `received`, `notice`, `rateLimited`, `setCollapsed`, `playerLeft` (borra burbuja), `reset`.
  Función pura `activeBubble(bubble, now)`.
- `ui/chatFormat.ts` (nuevo): `formatTime(sentAt)` → `HH:MM` local; `bubbleText(text)` → máx. 60 con «…».
- `ui/ChatPanel.tsx` (nuevo): abajo a la izquierda, semitransparente; lista con nombre (color del autor),
  hora y texto como nodos de texto de React (AC-6); avisos en gris; campo con `maxLength`, Intro envía y vacía,
  Escape quita el foco; Intro fuera del campo lo enfoca (AC-10); autodesplazamiento salvo que el usuario haya
  subido (AC-3); botón plegar/desplegar con contador (AC-17); aviso breve de «demasiado rápido» (AC-13).
- `scene/ChatBubble.tsx` (nuevo): sprite dibujado en lienzo, encima de `NameLabel`; `Avatar` recibe el id del
  participante y muestra la burbuja activa del store (AC-7, AC-8). La de quien sale desaparece con su avatar.
- `scene/input.ts`: no registra teclas si el `keydown` viene de un campo editable y limpia las pulsadas al
  enfocar uno (AC-9).
- `App.tsx`: monta `ChatPanel` solo dentro de la sala (AC-1).

## Contratos de red
| Mensaje | Dirección | Payload (tipo en `shared/`) | Respuestas / errores |
|---|---|---|---|
| `chat` | C→S | `ChatSend` | Válido → `chatMessage` a todos. Mal formado → descartado + `console.warn`. Excede el ritmo → `chatRejected` al emisor. |
| `chatMessage` | S→todos | `ChatMessage` | — |
| `chatHistory` | C→S / S→C | petición sin payload / `ChatMessage[]` (≤ 20) | — |
| `chatNotice` | S→demás | `ChatNotice` | No se envía al propio participante. |
| `chatRejected` | S→emisor | `ChatRejected` | — |

## Verificación de constitución
| Artículo | ¿Cumple? | Justificación |
|---|---|---|
| I | Sí | La spec no nombra mensajes, stores ni componentes; todo eso vive aquí. |
| II | Sí | El servidor valida texto y ritmo, fija autor, color, hora e id y guarda el historial; el cliente solo envía texto. El `maxLength` del campo es cortesía. |
| III | Sí | Mensajes, payloads y constantes en `shared/`; payloads entrantes como `unknown` y parseados; sin `any`. |
| IV | Sí | Cada función pura, la sala y el store llevan su test fallido antes de implementarse. |
| V | Sí | Sin dependencias nuevas (zustand y three ya están). |
| VI | Sí | Sin variables de entorno nuevas. |
| VII | Sí | Solo chat; audio y video quedan para la 005. La Fase 2 está cerrada. |

## Decisiones
- **Mensajes en lugar de schema:** meter el chat en el estado sincronizado obligaría a mantener un array en
  el schema y a recibir parches por cada mensaje; con mensajes, el historial se pide una vez al entrar.
- **Historial a petición del cliente** (en vez de enviarlo en `onJoin`): así el cliente ya ha registrado su
  manejador cuando llega la respuesta y no se pierde por orden de llegada.
- **Avisos de llegada/salida desde el servidor** (en vez de deducirlos en el cliente de los altas/bajas del
  estado): el estado inicial dispara altas de todos los presentes, que no son llegadas.
- **Burbuja como sprite de lienzo**, igual que `NameLabel`: sin `drei`/`<Html>` (retirada en la 002).
- **Ventana deslizante** para el ritmo: más justa que un contador por bloques fijos.

## Riesgos
- **Foco y teclado:** la escucha de teclado está en `window`; hay que filtrar por el objetivo del evento sin
  romper el olvido de teclas de la spec 002 AC-15. Se cubre con tests de `input.ts`.
- **Hora local:** depende de la zona del navegador; el test de `formatTime` fija la zona o compara con
  `Date#getHours`.

## Estrategia de pruebas
| AC | Tipo | Archivo / razón |
|---|---|---|
| AC-1 | integración + unit + manual | `OfficeRoom.test.ts` (historial ≤ 20 a quien lo pide, sin avisos); `store/chat.test.ts` (`history`); panel solo en sala: manual. |
| AC-2 | integración + unit + manual | `OfficeRoom.test.ts` (`chatMessage` a todos con autor, color y hora); `office.test.ts` (`sendChat`, entrega al sink); `chatFormat.test.ts` (HH:MM); campo vacío tras enviar: manual. |
| AC-3 | integración + manual | `OfficeRoom.test.ts` (orden de difusión = orden de llegada, ids crecientes); autodesplazamiento: manual (DOM y scroll real). |
| AC-4 | unit + integración | `shared/chat.test.ts` (vacío/espacios → `null`); `OfficeRoom.test.ts` (no se difunde). |
| AC-5 | unit + integración | `shared/chat.test.ts` (recorte, 200/201, puntos de código); `OfficeRoom.test.ts` (201 → descartado). |
| AC-6 | manual | Renderizado como texto: sin DOM de pruebas en el proyecto; se valida enviando `<b>hola</b>`. |
| AC-7 | unit + manual | `chatFormat.test.ts` (`bubbleText` 60 + «…»); `store/chat.test.ts` (burbuja por autor); sprite en escena: manual. |
| AC-8 | unit | `store/chat.test.ts` (`activeBubble` caduca a los 5 s; un mensaje nuevo sustituye y reinicia). |
| AC-9 | unit + manual | `input.test.ts` (teclas desde un campo editable no mueven; enfocar un campo limpia las pulsadas). |
| AC-10 | manual | Intro/Escape y foco: DOM real, en validación. |
| AC-11 | integración | `OfficeRoom.test.ts` (un `chat` con `authorName`/`authorId` falsos sale con los del emisor real). |
| AC-12 | unit + integración | `shared/chat.test.ts` (`parseChatSend`); `OfficeRoom.test.ts` (descarta, registra, la sala sigue). |
| AC-13 | unit + integración + manual | `shared/chat.test.ts` (`allowChat`); `OfficeRoom.test.ts` (6.º en 5 s → `chatRejected` y no se difunde; otros no afectados); `store/chat.test.ts` (aviso); aviso visible: manual. |
| AC-14 | unit + integración | `store/chat.test.ts` (`playerLeft` conserva mensajes y borra burbuja); `OfficeRoom.test.ts` (historial conserva mensajes de quien salió). |
| AC-15 | unit + manual | `office.test.ts` / `store/chat.test.ts` (`reset` al perder la conexión; nueva petición de historial al entrar); servidor parado: manual. |
| AC-16 | integración + unit | `OfficeRoom.test.ts` (`chatNotice` joined/left a los demás, no al propio); `store/chat.test.ts` (aviso sin burbuja, no suma no leídos). |
| AC-17 | unit + manual | `store/chat.test.ts` (no leídos solo plegado y solo mensajes; desplegar → 0); botón: manual. |
