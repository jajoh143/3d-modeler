import { Bone, Matrix, Skeleton, type Scene } from "@babylonjs/core";
import type { BodyParams } from "./body";

/**
 * Standard Mixamo bone names — required for round-trip through Mixamo and
 * animation retargeting tooling. Order matters: parent bones come before
 * their children so the constructor chain can look up parents by name.
 */
export const MIXAMO_BONE_NAMES = [
  "mixamorig:Hips",
  "mixamorig:Spine",
  "mixamorig:Spine1",
  "mixamorig:Spine2",
  "mixamorig:Neck",
  "mixamorig:Head",
  "mixamorig:LeftShoulder",
  "mixamorig:LeftArm",
  "mixamorig:LeftForeArm",
  "mixamorig:LeftHand",
  "mixamorig:RightShoulder",
  "mixamorig:RightArm",
  "mixamorig:RightForeArm",
  "mixamorig:RightHand",
  "mixamorig:LeftUpLeg",
  "mixamorig:LeftLeg",
  "mixamorig:LeftFoot",
  "mixamorig:LeftToeBase",
  "mixamorig:RightUpLeg",
  "mixamorig:RightLeg",
  "mixamorig:RightFoot",
  "mixamorig:RightToeBase",
] as const;

export type MixamoBone = (typeof MIXAMO_BONE_NAMES)[number];

/**
 * Parts merged into the humanoid mesh. Each part is rigidly bound to one bone
 * via per-vertex weight 1. The part mesh names must match what buildParts
 * produces in body.ts.
 */
export const PART_BONE_MAP: Record<string, MixamoBone> = {
  head: "mixamorig:Head",
  neck: "mixamorig:Neck",
  torso: "mixamorig:Spine2",
  pelvis: "mixamorig:Hips",
  upperArmL: "mixamorig:LeftArm",
  foreArmL: "mixamorig:LeftForeArm",
  upperArmR: "mixamorig:RightArm",
  foreArmR: "mixamorig:RightForeArm",
  thighL: "mixamorig:LeftUpLeg",
  shinL: "mixamorig:LeftLeg",
  footL: "mixamorig:LeftFoot",
  thighR: "mixamorig:RightUpLeg",
  shinR: "mixamorig:RightLeg",
  footR: "mixamorig:RightFoot",
};

interface BoneDef {
  name: MixamoBone;
  parent: MixamoBone | null;
  localPos: (p: BodyParams) => [number, number, number];
}

function deriveMeasurements(p: BodyParams) {
  const h = p.heightScale;
  return {
    h,
    torsoH: 0.6 * h,
    pelvisH: 0.16 * h,
    shoulderW: 0.44 * p.shoulders,
    hipW: 0.36 * p.hips,
    armUpperH: 0.3 * p.armLength * h,
    armLowerH: 0.28 * p.armLength * h,
    armR: 0.055 * p.muscle,
    legUpperH: 0.42 * p.legLength * h,
    legLowerH: 0.4 * p.legLength * h,
    footL: 0.22 * p.foot,
    footH: 0.06,
    neckH: 0.09 * p.neck,
  };
}

/** Local translation relative to parent bone. No rotation — all bones share world Y-up. */
const BONE_HIERARCHY: BoneDef[] = [
  { name: "mixamorig:Hips", parent: null, localPos: (p) => [0, deriveMeasurements(p).pelvisH / 2, 0] },
  { name: "mixamorig:Spine", parent: "mixamorig:Hips", localPos: (p) => [0, deriveMeasurements(p).pelvisH / 2, 0] },
  { name: "mixamorig:Spine1", parent: "mixamorig:Spine", localPos: (p) => [0, deriveMeasurements(p).torsoH / 3, 0] },
  { name: "mixamorig:Spine2", parent: "mixamorig:Spine1", localPos: (p) => [0, deriveMeasurements(p).torsoH / 3, 0] },
  { name: "mixamorig:Neck", parent: "mixamorig:Spine2", localPos: (p) => [0, deriveMeasurements(p).torsoH / 3, 0] },
  { name: "mixamorig:Head", parent: "mixamorig:Neck", localPos: (p) => [0, deriveMeasurements(p).neckH, 0] },

  { name: "mixamorig:LeftShoulder", parent: "mixamorig:Spine2", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [-m.shoulderW / 4, m.torsoH / 3, 0];
  } },
  { name: "mixamorig:LeftArm", parent: "mixamorig:LeftShoulder", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [-(m.shoulderW / 4 + m.armR), 0, 0];
  } },
  { name: "mixamorig:LeftForeArm", parent: "mixamorig:LeftArm", localPos: (p) => [0, -deriveMeasurements(p).armUpperH, 0] },
  { name: "mixamorig:LeftHand", parent: "mixamorig:LeftForeArm", localPos: (p) => [0, -deriveMeasurements(p).armLowerH, 0] },

  { name: "mixamorig:RightShoulder", parent: "mixamorig:Spine2", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [m.shoulderW / 4, m.torsoH / 3, 0];
  } },
  { name: "mixamorig:RightArm", parent: "mixamorig:RightShoulder", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [m.shoulderW / 4 + m.armR, 0, 0];
  } },
  { name: "mixamorig:RightForeArm", parent: "mixamorig:RightArm", localPos: (p) => [0, -deriveMeasurements(p).armUpperH, 0] },
  { name: "mixamorig:RightHand", parent: "mixamorig:RightForeArm", localPos: (p) => [0, -deriveMeasurements(p).armLowerH, 0] },

  { name: "mixamorig:LeftUpLeg", parent: "mixamorig:Hips", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [-m.hipW * 0.25, -m.pelvisH / 2, 0];
  } },
  { name: "mixamorig:LeftLeg", parent: "mixamorig:LeftUpLeg", localPos: (p) => [0, -deriveMeasurements(p).legUpperH, 0] },
  { name: "mixamorig:LeftFoot", parent: "mixamorig:LeftLeg", localPos: (p) => [0, -deriveMeasurements(p).legLowerH, 0] },
  { name: "mixamorig:LeftToeBase", parent: "mixamorig:LeftFoot", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [0, -m.footH / 2, m.footL * 0.5];
  } },

  { name: "mixamorig:RightUpLeg", parent: "mixamorig:Hips", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [m.hipW * 0.25, -m.pelvisH / 2, 0];
  } },
  { name: "mixamorig:RightLeg", parent: "mixamorig:RightUpLeg", localPos: (p) => [0, -deriveMeasurements(p).legUpperH, 0] },
  { name: "mixamorig:RightFoot", parent: "mixamorig:RightLeg", localPos: (p) => [0, -deriveMeasurements(p).legLowerH, 0] },
  { name: "mixamorig:RightToeBase", parent: "mixamorig:RightFoot", localPos: (p) => {
    const m = deriveMeasurements(p);
    return [0, -m.footH / 2, m.footL * 0.5];
  } },
];

export function buildSkeleton(scene: Scene, name: string, p: BodyParams): Skeleton {
  const skeleton = new Skeleton(`${name}_skel`, `${name}_skel`, scene);
  const byName = new Map<MixamoBone, Bone>();
  for (const def of BONE_HIERARCHY) {
    const [x, y, z] = def.localPos(p);
    const parent = def.parent ? byName.get(def.parent) ?? null : null;
    const bone = new Bone(def.name, skeleton, parent, Matrix.Translation(x, y, z));
    byName.set(def.name, bone);
  }
  return skeleton;
}

/** Ordered list of bone names in the order buildSkeleton creates them. */
export function boneIndexMap(skeleton: Skeleton): Map<string, number> {
  const map = new Map<string, number>();
  const bones = skeleton.bones;
  for (let i = 0; i < bones.length; i++) map.set(bones[i].name, i);
  return map;
}

/**
 * Build rigid skin weights: each vertex gets weight 1 on the bone assigned to
 * its source part. Requires deterministic part → vertex-range order matching
 * buildParts' merge order.
 */
export function computeRigidSkinData(
  parts: { name: string; vertexCount: number }[],
  boneIndex: Map<string, number>,
): { indices: Float32Array; weights: Float32Array } {
  let total = 0;
  for (const p of parts) total += p.vertexCount;
  const indices = new Float32Array(total * 4);
  const weights = new Float32Array(total * 4);
  let offset = 0;
  for (const p of parts) {
    const bone = PART_BONE_MAP[p.name];
    const bi = bone ? boneIndex.get(bone) ?? 0 : 0;
    for (let i = 0; i < p.vertexCount; i++) {
      const v = (offset + i) * 4;
      indices[v] = bi;
      weights[v] = 1;
    }
    offset += p.vertexCount;
  }
  return { indices, weights };
}
