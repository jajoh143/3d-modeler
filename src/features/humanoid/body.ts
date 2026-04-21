import {
  Mesh,
  MeshBuilder,
  MorphTarget,
  MorphTargetManager,
  PBRMetallicRoughnessMaterial,
  Vector3,
  VertexBuffer,
  type Scene,
} from "@babylonjs/core";
import type { RGB } from "../../editor/primitives/types";
import { boneIndexMap, buildSkeleton, computeRigidSkinData } from "./skeleton";

/**
 * Fixed topology: subdivision counts are constants, never a function of body params.
 * This keeps the vertex/index layout identical across all morph variants so
 * MorphTarget position deltas line up 1:1.
 */
const HEAD_SEGMENTS = 12;
const LIMB_SIDES = 10;
const LIMB_RINGS = 4;

/**
 * Per-slider coefficients. Each value is the physical delta applied to the
 * base body at influence=1. Defaults are the resting pose (all zero).
 */
export const MORPH_DEFS = [
  { key: "height", label: "Height", unit: "m" },
  { key: "weight", label: "Weight" },
  { key: "shoulders", label: "Shoulder width" },
  { key: "hips", label: "Hip width" },
  { key: "head", label: "Head size" },
  { key: "armLength", label: "Arm length" },
  { key: "legLength", label: "Leg length" },
  { key: "muscle", label: "Muscle" },
  { key: "neck", label: "Neck length" },
  { key: "chest", label: "Chest size" },
  { key: "waist", label: "Waist size" },
  { key: "foot", label: "Foot size" },
] as const;

export type MorphKey = (typeof MORPH_DEFS)[number]["key"];

export interface BodyParams {
  /** Physical height scalar in metres. */
  heightScale: number;
  /** Torso girth (chest + waist) multiplier. */
  weight: number;
  shoulders: number;
  hips: number;
  head: number;
  armLength: number;
  legLength: number;
  muscle: number;
  neck: number;
  chest: number;
  waist: number;
  foot: number;
}

/** The canonical neutral pose. Morph targets are deltas from this. */
export function neutralBodyParams(): BodyParams {
  return {
    heightScale: 1,
    weight: 1,
    shoulders: 1,
    hips: 1,
    head: 1,
    armLength: 1,
    legLength: 1,
    muscle: 1,
    neck: 1,
    chest: 1,
    waist: 1,
    foot: 1,
  };
}

/**
 * Map an influence value in [-1, 1] onto a BodyParams shape, combining multiple
 * morph channels. Called by `bakeMorphTargets` to compute variant meshes.
 */
function variantFor(morph: MorphKey): BodyParams {
  const p = neutralBodyParams();
  switch (morph) {
    case "height": p.heightScale = 1.18; break;
    case "weight": p.weight = 1.6; p.chest = 1.3; p.waist = 1.5; break;
    case "shoulders": p.shoulders = 1.35; break;
    case "hips": p.hips = 1.35; break;
    case "head": p.head = 1.25; break;
    case "armLength": p.armLength = 1.2; break;
    case "legLength": p.legLength = 1.2; break;
    case "muscle": p.muscle = 1.4; p.chest = 1.15; break;
    case "neck": p.neck = 1.4; break;
    case "chest": p.chest = 1.35; break;
    case "waist": p.waist = 1.35; break;
    case "foot": p.foot = 1.35; break;
  }
  return p;
}

interface Part {
  mesh: Mesh;
  name: string;
}

function buildParts(scene: Scene, p: BodyParams): Part[] {
  const h = p.heightScale;
  const headR = 0.12 * p.head;
  const neckH = 0.09 * p.neck;
  const neckR = 0.055;
  const torsoH = 0.6 * h;
  const pelvisH = 0.16 * h;
  const shoulderW = 0.44 * p.shoulders;
  const chestD = 0.26 * p.chest * (0.5 + 0.5 * p.weight);
  const waistD = 0.22 * p.waist * (0.5 + 0.5 * p.weight);
  const hipW = 0.36 * p.hips;
  const hipD = 0.24 * (0.5 + 0.5 * p.weight);
  const armUpperH = 0.3 * p.armLength * h;
  const armLowerH = 0.28 * p.armLength * h;
  const armR = 0.055 * p.muscle;
  const legUpperH = 0.42 * p.legLength * h;
  const legLowerH = 0.4 * p.legLength * h;
  const legR = 0.085 * p.muscle;
  const footL = 0.22 * p.foot;
  const footW = 0.1 * p.foot;
  const footH = 0.06;

  // Build in-order. Merging keeps this order, so vertex layout is fixed.
  const parts: Part[] = [];

  // Head
  const head = MeshBuilder.CreateSphere(
    "head",
    { diameter: headR * 2, segments: HEAD_SEGMENTS },
    scene,
  );
  head.position.y = pelvisH + torsoH + neckH + headR;
  parts.push({ mesh: head, name: "head" });

  // Neck
  const neck = MeshBuilder.CreateCylinder(
    "neck",
    { height: neckH, diameter: neckR * 2, tessellation: LIMB_SIDES, subdivisions: 1 },
    scene,
  );
  neck.position.y = pelvisH + torsoH + neckH / 2;
  parts.push({ mesh: neck, name: "neck" });

  // Torso — averaged chest/waist depth so both sliders influence silhouette.
  const torsoDepth = (chestD + waistD) / 2;
  const torso = MeshBuilder.CreateBox(
    "torso",
    { width: shoulderW, height: torsoH, depth: torsoDepth },
    scene,
  );
  torso.position.y = pelvisH + torsoH / 2;
  parts.push({ mesh: torso, name: "torso" });

  // Pelvis
  const pelvis = MeshBuilder.CreateBox(
    "pelvis",
    { width: hipW, height: pelvisH, depth: hipD },
    scene,
  );
  pelvis.position.y = pelvisH / 2;
  parts.push({ mesh: pelvis, name: "pelvis" });

  // Arms (upper then lower, L then R). Place so shoulder pivots at torso top corners.
  const shoulderY = pelvisH + torsoH - armUpperH / 2;
  for (const side of [-1, 1]) {
    const upper = MeshBuilder.CreateCylinder(
      side < 0 ? "upperArmL" : "upperArmR",
      { height: armUpperH, diameter: armR * 2, tessellation: LIMB_SIDES, subdivisions: LIMB_RINGS },
      scene,
    );
    upper.position.set(side * (shoulderW / 2 + armR), shoulderY, 0);
    parts.push({ mesh: upper, name: side < 0 ? "upperArmL" : "upperArmR" });

    const lower = MeshBuilder.CreateCylinder(
      side < 0 ? "foreArmL" : "foreArmR",
      { height: armLowerH, diameter: armR * 1.8, tessellation: LIMB_SIDES, subdivisions: LIMB_RINGS },
      scene,
    );
    lower.position.set(
      side * (shoulderW / 2 + armR),
      shoulderY - armUpperH / 2 - armLowerH / 2,
      0,
    );
    parts.push({ mesh: lower, name: side < 0 ? "foreArmL" : "foreArmR" });
  }

  // Legs (upper then lower then foot, L then R).
  // Thigh centred so its top is at pelvis bottom (y=0).
  const thighTop = 0;
  for (const side of [-1, 1]) {
    const thigh = MeshBuilder.CreateCylinder(
      side < 0 ? "thighL" : "thighR",
      { height: legUpperH, diameter: legR * 2, tessellation: LIMB_SIDES, subdivisions: LIMB_RINGS },
      scene,
    );
    thigh.position.set(side * hipW * 0.25, thighTop - legUpperH / 2, 0);
    parts.push({ mesh: thigh, name: side < 0 ? "thighL" : "thighR" });

    const shin = MeshBuilder.CreateCylinder(
      side < 0 ? "shinL" : "shinR",
      { height: legLowerH, diameter: legR * 1.7, tessellation: LIMB_SIDES, subdivisions: LIMB_RINGS },
      scene,
    );
    shin.position.set(
      side * hipW * 0.25,
      thighTop - legUpperH - legLowerH / 2,
      0,
    );
    parts.push({ mesh: shin, name: side < 0 ? "shinL" : "shinR" });

    const foot = MeshBuilder.CreateBox(
      side < 0 ? "footL" : "footR",
      { width: footW, height: footH, depth: footL },
      scene,
    );
    foot.position.set(
      side * hipW * 0.25,
      thighTop - legUpperH - legLowerH - footH / 2,
      footL * 0.2,
    );
    parts.push({ mesh: foot, name: side < 0 ? "footL" : "footR" });
  }

  return parts;
}

/**
 * Merge into a single mesh. Caller passes the shared material.
 * Topology is stable: same part order + same subdivisions = same vertex ordering.
 */
function mergeParts(name: string, parts: Part[], mat: PBRMetallicRoughnessMaterial): Mesh {
  for (const p of parts) p.mesh.material = mat;
  const merged = Mesh.MergeMeshes(
    parts.map((p) => p.mesh),
    true,
    true,
    undefined,
    false,
    false,
  );
  if (!merged) throw new Error(`humanoid: failed to merge ${parts.length} parts`);
  merged.name = name;
  merged.material = mat;
  return merged;
}

/** Build the neutral mesh + MorphTargetManager + Mixamo-named skeleton bound rigidly per part. */
export function buildHumanoid(
  scene: Scene,
  name: string,
  color: RGB,
): { mesh: Mesh; morphs: MorphTargetManager } {
  const mat = new PBRMetallicRoughnessMaterial(`${name}_mat`, scene);
  mat.baseColor.set(color[0], color[1], color[2]);
  mat.metallic = 0;
  mat.roughness = 0.7;

  const neutral = neutralBodyParams();
  const parts = buildParts(scene, neutral);
  const partCounts = parts.map((p) => ({ name: p.name, vertexCount: p.mesh.getTotalVertices() }));
  const mesh = mergeParts(name, parts, mat);

  const skeleton = buildSkeleton(scene, name, neutral);
  const { indices, weights } = computeRigidSkinData(partCounts, boneIndexMap(skeleton));
  mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, indices);
  mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, weights);
  mesh.skeleton = skeleton;
  mesh.numBoneInfluencers = 1;

  const mgr = new MorphTargetManager(scene);
  for (const def of MORPH_DEFS) {
    const variantParts = buildParts(scene, variantFor(def.key));
    const variantMat = new PBRMetallicRoughnessMaterial(`${name}_${def.key}_tmp`, scene);
    const variant = mergeParts(`${name}_${def.key}`, variantParts, variantMat);
    const positions = variant.getVerticesData("position");
    if (!positions) throw new Error("humanoid variant has no position data");
    const target = new MorphTarget(def.key, 0, scene);
    target.setPositions(positions.slice());
    mgr.addTarget(target);
    variant.dispose();
    variantMat.dispose();
  }

  mesh.morphTargetManager = mgr;
  return { mesh, morphs: mgr };
}

/** Apply a dictionary of bone-local euler rotations (radians) to an existing humanoid mesh. */
export function applyBoneRotations(mesh: Mesh, rotations: Record<string, [number, number, number]>): void {
  const skel = mesh.skeleton;
  if (!skel) return;
  for (const bone of skel.bones) {
    const r = rotations[bone.name];
    bone.setRotation(r ? new Vector3(r[0], r[1], r[2]) : new Vector3(0, 0, 0));
  }
}

/** Read current bone-local euler rotations. Omits bones at rest. */
export function readBoneRotations(mesh: Mesh): Record<string, [number, number, number]> {
  const skel = mesh.skeleton;
  if (!skel) return {};
  const out: Record<string, [number, number, number]> = {};
  for (const bone of skel.bones) {
    const r = bone.getRotation();
    if (r.x !== 0 || r.y !== 0 || r.z !== 0) out[bone.name] = [r.x, r.y, r.z];
  }
  return out;
}

/** Apply a dictionary of influences (0..1 each) to an existing humanoid mesh. */
export function applyMorphInfluences(mesh: Mesh, values: Record<string, number>): void {
  const mgr = mesh.morphTargetManager;
  if (!mgr) return;
  for (let i = 0; i < mgr.numTargets; i++) {
    const t = mgr.getTarget(i);
    const v = values[t.name];
    t.influence = typeof v === "number" ? clamp01(v) : 0;
  }
}

/** Read current influences back out as a plain dict. */
export function readMorphInfluences(mesh: Mesh): Record<string, number> {
  const mgr = mesh.morphTargetManager;
  if (!mgr) return {};
  const out: Record<string, number> = {};
  for (let i = 0; i < mgr.numTargets; i++) {
    const t = mgr.getTarget(i);
    out[t.name] = t.influence;
  }
  return out;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Vertical distance from hip-origin to the lowest foot vertex at neutral params.
 * Used by the humanoid primitive's baseY to rest the figure on the grid.
 */
export function neutralFootOffset(): number {
  const p = neutralBodyParams();
  const legUpperH = 0.42 * p.legLength * p.heightScale;
  const legLowerH = 0.4 * p.legLength * p.heightScale;
  const footH = 0.06;
  return legUpperH + legLowerH + footH;
}
