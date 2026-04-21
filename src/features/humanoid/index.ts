import type { PrimitiveDef } from "../../editor/primitives/types";
import {
  MORPH_DEFS,
  applyBoneRotations,
  applyMorphInfluences,
  buildHumanoid,
  neutralFootOffset,
  readBoneRotations,
  readMorphInfluences,
} from "./body";

const SKIN_TONE: [number, number, number] = [0.82, 0.66, 0.55];

export const HUMANOID: PrimitiveDef = {
  id: "humanoid",
  label: "Humanoid",
  category: "characters",
  icon: "person",
  defaultColor: SKIN_TONE,
  // Humanoid sliders live on the MorphTargetManager, not the PrimitiveDef.params list.
  params: [],
  build(scene, name, _params, color) {
    const { mesh } = buildHumanoid(scene, name, color);
    return mesh;
  },
  baseY: () => neutralFootOffset(),
};

export const CHARACTER_PRIMITIVES = [HUMANOID];

export {
  MORPH_DEFS,
  applyBoneRotations,
  applyMorphInfluences,
  readBoneRotations,
  readMorphInfluences,
};
export type { MorphKey } from "./body";
