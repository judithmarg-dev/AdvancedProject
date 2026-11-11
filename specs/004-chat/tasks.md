# Tareas · 004 Chat de sala

Orden: shared → server → client. Primero el test que falla, luego la implementación.

### shared
- [x] T1 · (AC-4, AC-5, AC-12, AC-13) Test: `shared/chat.test.ts` — `normalizeChatText` (vacío, espacios, recorte, 200/201, puntos de código, no string), `parseChatSend` (válido, faltante, tipos) y `allowChat` (5 en 5 s sí, 6.º no, la ventana se desliza).
- [x] T2 · (AC-4, AC-5, AC-12, AC-13) Implementar `shared/chat.ts`, `CHAT`, los `MSG` de chat y los tipos `ChatSend`, `ChatMessage`, `ChatNotice`, `ChatRejected` en `shared/types.ts`.

### server
- [x] T3 · (AC-2, AC-3, AC-11) Test de integración: `chat` válido → `chatMessage` a todos con autor, color, hora e id crecientes en orden de llegada; campos de autor falsos se ignoran.
- [x] T4 · (AC-4, AC-5, AC-12, AC-13) Test de integración: vacío, 201 caracteres o mal formado → no se difunde, se registra y la sala sigue; 6.º en 5 s → `chatRejected` al emisor, los demás siguen pudiendo escribir.
- [x] T5 · (AC-1, AC-14, AC-15, AC-16) Test de integración: `chatHistory` devuelve los últimos 20 (con mensajes de quien ya salió, sin avisos); entrar/salir → `chatNotice` a los demás y no al propio.
- [x] T6 · (AC-1–AC-5, AC-11–AC-16) Implementar los manejadores de chat, el historial y los avisos en `OfficeRoom`.

### client
- [x] T7 · (AC-1, AC-7, AC-8, AC-13, AC-14, AC-15, AC-16, AC-17) Test: `client/src/store/chat.test.ts` — historial, recibir (tope 100), avisos sin burbuja, burbuja por autor con caducidad y sustitución (`activeBubble`), no leídos solo plegado y solo mensajes, desplegar → 0, aviso de ritmo, `playerLeft`, `reset`.
- [x] T8 · Implementar `client/src/store/chat.ts`.
- [x] T9 · (AC-2, AC-7) Test: `client/src/ui/chatFormat.test.ts` — `formatTime` HH:MM local con ceros; `bubbleText` sin cambios hasta 60 y con «…» por encima.
- [x] T10 · Implementar `client/src/ui/chatFormat.ts`.
- [x] T11 · (AC-1, AC-2, AC-13, AC-15, AC-16) Test: `client/src/net/office.test.ts` — `sendChat` envía `chat`; tras unirse pide `chatHistory`; payloads de chat entrantes llegan al sink y los mal formados se descartan; al perder la conexión se vacía el chat.
- [x] T12 · Implementar el chat en `client/src/net/office.ts` y conectar el sink al store de chat.
- [x] T13 · (AC-9) Test: `client/src/scene/input.test.ts` — un `keydown` de movimiento desde un campo editable no mueve; enfocar un campo editable olvida las teclas pulsadas.
- [x] T14 · (AC-9) Implementar el filtro en `client/src/scene/input.ts`.
- [x] T15 · (AC-7, AC-8, AC-14) `scene/ChatBubble.tsx` (sprite encima de la etiqueta) y `Avatar`/`RemoteAvatar`/`Scene` pasando el id para leer la burbuja activa.
- [x] T16 · (AC-1, AC-2, AC-3, AC-6, AC-10, AC-13, AC-16, AC-17) `ui/ChatPanel.tsx` y estilos; `App` lo monta solo dentro de la sala.
- [x] T17 · `npm run build` y `npm test` en verde.

### Cierre
- [x] T18 · `/sdd-validate-impl` con dos pestañas (cambio visible en cliente, servidor y red).
- [x] T19 · Trazabilidad en `spec.md`, `PLAN.md` (estado, casillas, decisiones) y `/sdd-verify`.
