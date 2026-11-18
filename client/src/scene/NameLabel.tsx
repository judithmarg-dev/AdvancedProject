import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { AVATAR } from "@office/shared";
import { useAv, voiceMark, type VoiceMark } from "../store/av";
import { useSession } from "../store/session";
import { PALETTE } from "./palette";

/** Alto de la etiqueta en el mundo (m) y resolución del lienzo que la dibuja. */
const LABEL_HEIGHT = 0.26;
const CANVAS_HEIGHT = 64;
const FONT = `600 34px "Segoe UI", system-ui, sans-serif`;
const PADDING_X = 22;
/** Hueco para el icono de voz (spec 005 AC-13). */
const ICON_SIZE = 40;
const ICON_GAP = 10;

/** Punto verde con ondas (hablando) o micrófono tachado (apagado), dibujados a mano para no depender de fuentes. */
function drawVoiceIcon(ctx: CanvasRenderingContext2D, mark: Exclude<VoiceMark, "none">, x: number, y: number) {
  const r = ICON_SIZE / 2;
  ctx.save();
  ctx.translate(x + r, y);
  ctx.beginPath();
  ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
  ctx.fillStyle = mark === "speaking" ? "#7FC08A" : "#C8705A";
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  // micrófono: cápsula y soporte
  ctx.beginPath();
  ctx.roundRect(-4.5, -11, 9, 15, 4.5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.moveTo(0, 8);
  ctx.lineTo(0, 12);
  ctx.stroke();
  if (mark === "muted") {
    ctx.beginPath();
    ctx.moveTo(-11, -11);
    ctx.lineTo(11, 11);
    ctx.stroke();
  }
  ctx.restore();
}

/** Pastilla con el nombre y, si toca, el icono de voz a su izquierda, dibujada en un lienzo 2D. */
function drawLabel(name: string, mark: VoiceMark): { texture: CanvasTexture; aspect: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = FONT;
  const icon = mark === "none" ? 0 : ICON_SIZE + ICON_GAP;
  const textWidth = Math.ceil(ctx.measureText(name).width);
  const width = textWidth + PADDING_X * 2 + icon;
  canvas.width = width;
  canvas.height = CANVAS_HEIGHT;

  const r = CANVAS_HEIGHT / 2;
  ctx.fillStyle = "rgba(47, 58, 44, 0.72)";
  ctx.beginPath();
  ctx.roundRect(0, 0, width, CANVAS_HEIGHT, r);
  ctx.fill();

  if (mark !== "none") drawVoiceIcon(ctx, mark, PADDING_X - 8, CANVAS_HEIGHT / 2);

  ctx.font = FONT;
  ctx.fillStyle = PALETTE.wall;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, PADDING_X + icon + textWidth / 2, CANVAS_HEIGHT / 2 + 1);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, aspect: width / CANVAS_HEIGHT };
}

/**
 * Nombre flotando sobre el avatar; un sprite siempre mira a la cámara (spec 003 AC-7). Junto al nombre,
 * el indicador de habla o de micrófono apagado (spec 005 AC-13).
 */
export function NameLabel({ id, name }: { id: string; name: string }) {
  const selfId = useSession((state) => state.selfId);
  const mark = useAv((state) => voiceMark(state, selfId, id));
  const { texture, aspect } = useMemo(() => drawLabel(name, mark), [name, mark]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={[0, AVATAR.height + 0.32, 0]} scale={[LABEL_HEIGHT * aspect, LABEL_HEIGHT, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
