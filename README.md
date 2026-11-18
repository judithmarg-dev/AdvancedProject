# Oficina virtual 3D

Sala 3D en el navegador donde varias personas se mueven con avatares, chatean y se oyen y se ven por
proximidad (estilo Gather Town). Sirve como plantilla para oficinas, eventos u onboarding.

- **Cliente:** Vite + React + three / @react-three/fiber (`client/`)
- **Servidor:** Node + Colyseus (`server/`), autoritativo sobre posiciones y chat
- **Audio/video:** LiveKit (opcional)
- **Tipos compartidos:** `shared/`

## Arranque rápido (≈ 3 min)

Requisitos: **Node 20.12 o superior** y npm. En Windows, usa una terminal nativa (PowerShell o CMD), no WSL.

```bash
git clone <url-del-repositorio> oficina-3d
cd oficina-3d
npm install
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env
npm run dev
```

Abre <http://localhost:5173>, escribe tu nombre y pulsa **Entrar**. Para ver el multijugador, abre una segunda
pestaña (o mejor, otro navegador) en la misma dirección con otro nombre.

Sin LiveKit todo funciona menos la voz: verás el aviso «La voz no está disponible ahora» y los botones de
micrófono y cámara desactivados.

## Controles

| Acción | Tecla |
|---|---|
| Moverse | WASD o flechas |
| Escribir en el chat | Intro (Escape vuelve a la sala) |
| Micrófono encendido/apagado | M o el botón de abajo |
| Cámara encendida/apagada | V o el botón de abajo |

Oyes a quien está cerca: volumen pleno hasta 2 m, baja poco a poco y desaparece a partir de 8 m. Ves la
cámara de quien está a 8 m o menos (como mucho 4).

## Variables de entorno (`.env`)

| Variable | Uso | Valor por defecto en `.env.example` |
|---|---|---|
| `PORT` | Puerto del servidor Colyseus | `2567` |
| `VITE_SERVER_URL` | Dirección del servidor que usa el cliente | `ws://localhost:2567` |
| `LIVEKIT_URL` | Servidor LiveKit (lo recibe el cliente del servidor) | `ws://localhost:7880` |
| `LIVEKIT_API_KEY` | Clave de LiveKit (solo servidor) | `devkey` |
| `LIVEKIT_API_SECRET` | Secreto de LiveKit (solo servidor) | `secret` |

Los valores de LiveKit de `.env.example` son los públicos del modo de desarrollo. **No subas `.env`** (está en
`.gitignore`); en producción usa claves propias.

## Activar la voz y la cámara (opcional)

Necesitas Docker. En otra terminal:

```bash
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp livekit/livekit-server --dev --bind 0.0.0.0
```

Reinicia `npm run dev`. La consola del servidor dirá `Audio/video con LiveKit en ws://localhost:7880`. Al
entrar te unes al canal automáticamente; micrófono y cámara empiezan apagados y el navegador pide permiso la
primera vez que los enciendes. Usa auriculares si pruebas con dos pestañas en el mismo equipo.

## La sala como modelo 3D

La sala se carga de `client/public/models/office.glb` (glTF binario comprimido con Draco, < 5 MB). Mientras
se descarga, o si falta, se ve la sala básica dibujada por código.

- **Regenerar el modelo por defecto** (a partir de las medidas de `shared/world.ts`):
  `npm run model -w client`
- **Usar tu propia sala de Blender:** *Archivo → Exportar → glTF 2.0*, formato **glTF Binary (.glb)**, con
  *Compresión* (Draco) activada, y guárdalo como `client/public/models/office.glb`. No hace falta tocar código.
  Las colisiones salen de `shared/world.ts` (`WALLS`, `FURNITURE`): si cambias la distribución de muebles,
  actualiza también esas medidas. Las mallas que empiecen por `floor`, `rug` o `wall-` solo reciben sombra.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Cliente (5173) y servidor (2567) en paralelo |
| `npm run build` | Comprueba tipos de los tres paquetes y genera `client/dist` |
| `npm test` | Pruebas (Vitest) de todos los paquetes |
| `npm run model -w client` | Regenera `office.glb` |

## Problemas frecuentes

- **«El puerto 5173/2567 ya está en uso»:** cierra la otra instancia (`npm run dev` no cambia de puerto).
- **«No se pudo conectar con el servidor»:** el servidor no está arrancado o `VITE_SERVER_URL` no coincide con `PORT`.
- **No se oye a nadie:** comprueba que LiveKit está en marcha, que la otra persona tiene el micrófono encendido
  y que estáis a menos de 8 m; haz clic en la página una vez (el navegador bloquea el audio hasta un gesto).

## Estructura y metodología

```
shared/   tipos de red, constantes y reglas puras (colisiones, chat, proximidad)
server/   sala Colyseus (OfficeRoom) y emisión del acceso a LiveKit
client/   escena 3D, red, estado (zustand) y UI
specs/    una spec por fase (SDD): spec.md, plan.md, tasks.md
```

El plan del proyecto y su estado están en `PLAN.md`; las reglas de trabajo, en `CLAUDE.md`.
