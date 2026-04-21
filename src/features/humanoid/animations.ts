import {
  Animation,
  AnimationGroup,
  Quaternion,
  SceneLoader,
  type Bone,
  type Scene,
  type Skeleton,
} from "@babylonjs/core";

const FPS = 60;

export interface AnimationDef {
  id: string;
  label: string;
  build: (scene: Scene, skeleton: Skeleton) => AnimationGroup;
}

interface BoneKey {
  frame: number;
  euler: [number, number, number];
}

interface BoneTrack {
  bone: string;
  keys: BoneKey[];
}

function makeGroup(
  scene: Scene,
  skeleton: Skeleton,
  id: string,
  tracks: BoneTrack[],
  loop: boolean,
): AnimationGroup {
  const group = new AnimationGroup(id, scene);
  group.loopAnimation = loop;
  for (const track of tracks) {
    const bone = boneByName(skeleton, track.bone);
    if (!bone) continue;
    const anim = new Animation(
      `${id}_${track.bone}`,
      "rotationQuaternion",
      FPS,
      Animation.ANIMATIONTYPE_QUATERNION,
      loop ? Animation.ANIMATIONLOOPMODE_CYCLE : Animation.ANIMATIONLOOPMODE_CONSTANT,
    );
    anim.setKeys(
      track.keys.map((k) => ({
        frame: k.frame,
        value: Quaternion.FromEulerAngles(k.euler[0], k.euler[1], k.euler[2]),
      })),
    );
    group.addTargetedAnimation(anim, bone);
  }
  group.normalize(0, lastFrame(tracks));
  return group;
}

function lastFrame(tracks: BoneTrack[]): number {
  let max = 0;
  for (const t of tracks) {
    for (const k of t.keys) if (k.frame > max) max = k.frame;
  }
  return max;
}

function boneByName(skeleton: Skeleton, name: string): Bone | undefined {
  return skeleton.bones.find((b) => b.name === name);
}

/** Subtle breathing + sway. 2 s loop. */
function buildIdle(scene: Scene, skeleton: Skeleton): AnimationGroup {
  const tracks: BoneTrack[] = [
    {
      bone: "mixamorig:Spine1",
      keys: [
        { frame: 0, euler: [0, 0, 0] },
        { frame: 60, euler: [-0.03, 0, 0.04] },
        { frame: 120, euler: [0, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:Spine2",
      keys: [
        { frame: 0, euler: [0, 0, 0] },
        { frame: 60, euler: [0.04, 0, -0.02] },
        { frame: 120, euler: [0, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:Head",
      keys: [
        { frame: 0, euler: [0, 0, 0] },
        { frame: 60, euler: [0, 0.05, 0] },
        { frame: 120, euler: [0, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:LeftArm",
      keys: [
        { frame: 0, euler: [0, 0, -0.08] },
        { frame: 60, euler: [0, 0, -0.11] },
        { frame: 120, euler: [0, 0, -0.08] },
      ],
    },
    {
      bone: "mixamorig:RightArm",
      keys: [
        { frame: 0, euler: [0, 0, 0.08] },
        { frame: 60, euler: [0, 0, 0.11] },
        { frame: 120, euler: [0, 0, 0.08] },
      ],
    },
  ];
  return makeGroup(scene, skeleton, "Idle", tracks, true);
}

/** Right-hand wave. Arm stays lifted while forearm oscillates. 3 s loop. */
function buildWave(scene: Scene, skeleton: Skeleton): AnimationGroup {
  const up = 2.4; // arm overhead
  const tracks: BoneTrack[] = [
    {
      bone: "mixamorig:RightArm",
      keys: [
        { frame: 0, euler: [0, 0, 0] },
        { frame: 30, euler: [0, 0, up] },
        { frame: 150, euler: [0, 0, up] },
        { frame: 180, euler: [0, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:RightForeArm",
      keys: [
        { frame: 0, euler: [0, 0, 0] },
        { frame: 30, euler: [0, 0, 0.6] },
        { frame: 60, euler: [0, 0, -0.5] },
        { frame: 90, euler: [0, 0, 0.6] },
        { frame: 120, euler: [0, 0, -0.5] },
        { frame: 150, euler: [0, 0, 0.6] },
        { frame: 180, euler: [0, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:Head",
      keys: [
        { frame: 0, euler: [0, 0, 0] },
        { frame: 30, euler: [0, -0.1, 0] },
        { frame: 150, euler: [0, -0.1, 0] },
        { frame: 180, euler: [0, 0, 0] },
      ],
    },
  ];
  return makeGroup(scene, skeleton, "Wave", tracks, true);
}

/** Two-step walk cycle (L forward, R forward). 1.2 s loop. */
function buildWalk(scene: Scene, skeleton: Skeleton): AnimationGroup {
  const stride = 0.55;
  const armSwing = 0.5;
  const tracks: BoneTrack[] = [
    {
      bone: "mixamorig:LeftUpLeg",
      keys: [
        { frame: 0, euler: [-stride, 0, 0] },
        { frame: 18, euler: [0, 0, 0] },
        { frame: 36, euler: [stride, 0, 0] },
        { frame: 54, euler: [0, 0, 0] },
        { frame: 72, euler: [-stride, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:LeftLeg",
      keys: [
        { frame: 0, euler: [0.1, 0, 0] },
        { frame: 18, euler: [0.6, 0, 0] },
        { frame: 36, euler: [0.1, 0, 0] },
        { frame: 54, euler: [0.1, 0, 0] },
        { frame: 72, euler: [0.1, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:RightUpLeg",
      keys: [
        { frame: 0, euler: [stride, 0, 0] },
        { frame: 18, euler: [0, 0, 0] },
        { frame: 36, euler: [-stride, 0, 0] },
        { frame: 54, euler: [0, 0, 0] },
        { frame: 72, euler: [stride, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:RightLeg",
      keys: [
        { frame: 0, euler: [0.1, 0, 0] },
        { frame: 18, euler: [0.1, 0, 0] },
        { frame: 36, euler: [0.1, 0, 0] },
        { frame: 54, euler: [0.6, 0, 0] },
        { frame: 72, euler: [0.1, 0, 0] },
      ],
    },
    {
      bone: "mixamorig:LeftArm",
      keys: [
        { frame: 0, euler: [armSwing, 0, -0.08] },
        { frame: 36, euler: [-armSwing, 0, -0.08] },
        { frame: 72, euler: [armSwing, 0, -0.08] },
      ],
    },
    {
      bone: "mixamorig:RightArm",
      keys: [
        { frame: 0, euler: [-armSwing, 0, 0.08] },
        { frame: 36, euler: [armSwing, 0, 0.08] },
        { frame: 72, euler: [-armSwing, 0, 0.08] },
      ],
    },
    {
      bone: "mixamorig:Spine",
      keys: [
        { frame: 0, euler: [0, 0.05, 0] },
        { frame: 36, euler: [0, -0.05, 0] },
        { frame: 72, euler: [0, 0.05, 0] },
      ],
    },
  ];
  return makeGroup(scene, skeleton, "Walk", tracks, true);
}

export const ANIMATION_DEFS: AnimationDef[] = [
  { id: "idle", label: "Idle", build: buildIdle },
  { id: "wave", label: "Wave", build: buildWave },
  { id: "walk", label: "Walk", build: buildWalk },
];

/**
 * Retarget an imported AnimationGroup's bone tracks onto the given skeleton.
 * Matches by bone name. Bones not present in the destination are silently dropped.
 */
export function retargetAnimation(
  source: AnimationGroup,
  destSkeleton: Skeleton,
  scene: Scene,
  newId: string,
): AnimationGroup | null {
  const group = new AnimationGroup(newId, scene);
  group.loopAnimation = source.loopAnimation;
  let hits = 0;
  for (const ta of source.targetedAnimations) {
    const target = ta.target as { name?: string } | undefined;
    if (!target?.name) continue;
    const dest = boneByName(destSkeleton, target.name);
    if (!dest) continue;
    group.addTargetedAnimation(ta.animation.clone(), dest);
    hits++;
  }
  if (hits === 0) {
    group.dispose();
    return null;
  }
  return group;
}

/**
 * Load animations from a .glb file picked by the user and retarget them onto
 * the given humanoid's skeleton. Returns the created AnimationGroups.
 */
export async function importAnimationsFromFile(
  file: File,
  scene: Scene,
  destSkeleton: Skeleton,
): Promise<AnimationGroup[]> {
  const url = URL.createObjectURL(file);
  try {
    const result = await SceneLoader.ImportMeshAsync("", "", url, scene, undefined, ".glb");
    const out: AnimationGroup[] = [];
    for (const group of result.animationGroups) {
      const retarget = retargetAnimation(group, destSkeleton, scene, `${file.name}:${group.name}`);
      if (retarget) out.push(retarget);
      group.dispose();
    }
    // Dispose imported meshes/skeletons — we only want the animations.
    for (const m of result.meshes) m.dispose();
    for (const s of result.skeletons) s.dispose();
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
