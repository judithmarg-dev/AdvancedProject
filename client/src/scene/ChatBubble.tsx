import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace, type Sprite } from "three";
import { AVATAR } from "@office/shared";
import { activeBubble, useChat } from "../store/chat";
import { bubbleText } from "../ui/chatFormat";
import { PALETTE } from "./palette";

/** Alto de una línea en el mundo (m) y medidas del lienzo que dibuja la burbuja. */
const LINE_HEIGHT_WORLD = 0.2;
const FONT_PX = 30;
const LINE_PX = 40;
const PADDING_PX = 20;
const TAIL_PX = 14;
const MAX_LINE_PX = 380;
const FONT = `500 ${FONT_PX}px "Segoe UI", system-ui, sans-serif`;
/** Base de la burbuja: justo encima de la etiqueta de nombre (spec 003 AC-7). */
const BASE_Y = AVATAR.height + 0.5;

/** Reparte el texto en líneas que caben en `MAX_LINE_PX`, partiendo palabras demasiado largas. */
function wrap(ctx: CanvasRenderingContext2D, text: string): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= MAX_LINE_PX) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const char of word) {
      if (ctx.measureText(line + char).width > MAX_LINE_PX) {
        lines.push(line);
        line = "";
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Bocadillo claro con una colita hacia el avatar; el texto se dibuja como texto, nunca como HTML (AC-6). */
function drawBubble(text: string): { texture: CanvasTexture; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = FONT;
  const lines = wrap(ctx, text);
  const textWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const width = Math.ceil(textWidth) + PADDING_PX * 2;
  const boxHeight = lines.length * LINE_PX + PADDING_PX;
  canvas.width = width;
  canvas.height = boxHeight + TAIL_PX;

  ctx.fillStyle = "rgba(246, 242, 233, 0.95)";
  ctx.strokeStyle = "rgba(47, 58, 44, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, boxHeight - 2, 18);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width / 2 - TAIL_PX, boxHeight - 2);
  ctx.lineTo(width / 2, boxHeight + TAIL_PX - 1);
  ctx.lineTo(width / 2 + TAIL_PX, boxHeight - 2);
  ctx.fill();

  ctx.font = FONT;
  ctx.fillStyle = PALETTE.face;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, width / 2, PADDING_PX / 2 + LINE_PX * (i + 0.5)));

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, width: canvas.width, height: canvas.height };
}

/** Último mensaje del participante `id` sobre su avatar, mientras siga vigente (spec 004 AC-7, AC-8). */
export function ChatBubble({ id }: { id: string }) {
  const bubble = useChat((state) => state.bubbles[id]);
  const sprite = useRef<Sprite>(null);

  const drawn = useMemo(() => (bubble ? drawBubble(bubbleText(bubble.text)) : null), [bubble]);
  useEffect(() => () => drawn?.texture.dispose(), [drawn]);

  // La caducidad se comprueba por fotograma sin tocar el estado de React.
  useFrame(() => {
    if (sprite.current) sprite.current.visible = activeBubble(bubble, performance.now()) !== null;
  });

  if (!drawn) return null;
  const scale = LINE_HEIGHT_WORLD / LINE_PX;
  return (
    <sprite
      ref={sprite}
      position={[0, BASE_Y, 0]}
      center={[0.5, 0]}
      scale={[drawn.width * scale, drawn.height * scale, 1]}
      renderOrder={11}
    >
      <spriteMaterial map={drawn.texture} transparent depthWrite={false} />
    </sprite>
  );
}
