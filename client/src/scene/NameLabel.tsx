import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { AVATAR } from "@office/shared";
import { PALETTE } from "./palette";

/** Alto de la etiqueta en el mundo (m) y resolución del lienzo que la dibuja. */
const LABEL_HEIGHT = 0.26;
const CANVAS_HEIGHT = 64;
const FONT = `600 34px "Segoe UI", system-ui, sans-serif`;
const PADDING_X = 22;

/** Pastilla con el nombre, dibujada en un lienzo 2D. */
function drawLabel(name: string): { texture: CanvasTexture; aspect: number } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = FONT;
  const width = Math.ceil(ctx.measureText(name).width) + PADDING_X * 2;
  canvas.width = width;
  canvas.height = CANVAS_HEIGHT;

  const r = CANVAS_HEIGHT / 2;
  ctx.fillStyle = "rgba(47, 58, 44, 0.72)";
  ctx.beginPath();
  ctx.roundRect(0, 0, width, CANVAS_HEIGHT, r);
  ctx.fill();

  ctx.font = FONT;
  ctx.fillStyle = PALETTE.wall;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, width / 2, CANVAS_HEIGHT / 2 + 1);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, aspect: width / CANVAS_HEIGHT };
}

/** Nombre flotando sobre el avatar; un sprite siempre mira a la cámara (spec 003 AC-7). */
export function NameLabel({ name }: { name: string }) {
  const { texture, aspect } = useMemo(() => drawLabel(name), [name]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite position={[0, AVATAR.height + 0.32, 0]} scale={[LABEL_HEIGHT * aspect, LABEL_HEIGHT, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
