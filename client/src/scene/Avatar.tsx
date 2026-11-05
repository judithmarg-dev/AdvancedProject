import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { AVATAR } from "@office/shared";
import { PALETTE, shadeColor } from "./palette";
import { advanceWalkPhase, breathingOffset, squashScale, walkBob } from "./animation";
import { NameLabel } from "./NameLabel";
import { avatarGrainTexture } from "./grain";
import type { PlayerState } from "./usePlayerController";

/** Lo que el avatar necesita leer en cada fotograma; lo escribe el controlador local o la interpolación. */
export type AvatarMotion = Pick<PlayerState, "position" | "angle" | "speed" | "acceleration" | "elapsed">;

const BODY_RADIUS = AVATAR.radius;
const BODY_STRETCH = 1.22; // la cápsula es algo más alta que ancha
const FRONT = -BODY_RADIUS * 0.92; // la cara mira hacia -Z, igual que el avance
/** Relieve del grano: lo justo para que la luz lo marque sin volver rugoso el contorno (AC-21). */
const GRAIN_BUMP = 0.6;

/** Material del cuerpo, brazos y pies: su color con grano (spec 003 AC-21). */
function GrainMaterial({ color, roughness }: { color: string; roughness: number }) {
  const grain = avatarGrainTexture();
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={0.02}
      map={grain}
      roughnessMap={grain}
      bumpMap={grain}
      bumpScale={GRAIN_BUMP}
    />
  );
}

/** Ojo: esfera achatada contra el cuerpo. */
function Eye({ x }: { x: number }) {
  return (
    <mesh position={[x, 0.12, FRONT * 0.96]} scale={[1, 1.15, 0.5]}>
      <sphereGeometry args={[0.035, 16, 12]} />
      <meshStandardMaterial color={PALETTE.face} roughness={0.35} />
    </mesh>
  );
}

/**
 * Avatar de un participante (propio o ajeno): cápsula redondeada de su color con cara simple, bracitos,
 * pies y su nombre encima. Toda la animación ocurre en `useFrame` sobre refs; no hay estado de React por
 * fotograma (spec 002 AC-14).
 */
export function Avatar({ player, color, name }: { player: AvatarMotion; color: string; name: string }) {
  const footColor = useMemo(() => shadeColor(color), [color]);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const walkPhase = useRef(0);

  useFrame((_, delta) => {
    const group = root.current;
    const bodyGroup = body.current;
    if (!group || !bodyGroup) return;

    player.elapsed += delta;
    group.position.x = player.position.x;
    group.position.z = player.position.z;
    group.rotation.y = player.angle;

    // Reposo: respiración. En marcha: balanceo del paso (AC-11, AC-12).
    const idle = player.speed < 0.05;
    walkPhase.current = idle ? 0 : advanceWalkPhase(walkPhase.current, delta, player.speed);
    const lift = idle ? breathingOffset(player.elapsed) : walkBob(walkPhase.current, player.speed);
    bodyGroup.position.y = lift;

    const squash = squashScale(player.acceleration);
    bodyGroup.scale.set(squash.x, squash.y * BODY_STRETCH, squash.z);

    if (shadow.current) {
      const material = shadow.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.18 - lift * 0.1;
      }
    }
  });

  return (
    <group ref={root} position={[player.position.x, 0, player.position.z]}>
      {/* sombra de contacto barata: un disco oscuro bajo el avatar */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[BODY_RADIUS * 0.95, 24]} />
        <meshBasicMaterial color="#6E7A63" transparent opacity={0.18} />
      </mesh>

      <group ref={body} position={[0, 0, 0]}>
        <mesh position={[0, BODY_RADIUS * 1.05, 0]} castShadow>
          <sphereGeometry args={[BODY_RADIUS, 32, 24]} />
          <GrainMaterial color={color} roughness={0.65} />
        </mesh>

        {/* cara: hija del cuerpo, así gira con él (AC-6) */}
        <group position={[0, BODY_RADIUS * 0.98, 0]}>
          <Eye x={-0.11} />
          <Eye x={0.11} />
          <mesh position={[0, 0.1, FRONT * 1.05]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.012, 10, 20, Math.PI]} />
            <meshStandardMaterial color={PALETTE.face} roughness={0.4} />
          </mesh>
        </group>

        {/* bracitos */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * BODY_RADIUS * 0.95, BODY_RADIUS * 0.95, 0]}
            scale={[1, 0.8, 0.9]}
            castShadow
          >
            <sphereGeometry args={[0.1, 16, 12]} />
            <GrainMaterial color={color} roughness={0.35} />
          </mesh>
        ))}

        {/* pies */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.13, 0.055, -0.06]} scale={[1, 0.6, 1.3]} castShadow>
            <sphereGeometry args={[0.075, 16, 12]} />
            <GrainMaterial color={footColor} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* fuera del cuerpo: la etiqueta no se deforma con el squash ni sube y baja al respirar */}
      <NameLabel name={name} />
    </group>
  );
}
