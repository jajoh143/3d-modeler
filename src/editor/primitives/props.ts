import type { PrimitiveDef } from "./types";
import { cyl, makeMaterial, mergeCompound } from "./helpers";

export const BOTTLE: PrimitiveDef = {
  id: "bottle",
  label: "Bottle",
  category: "props",
  icon: "bottle",
  defaultColor: [0.15, 0.3, 0.22],
  params: [
    { key: "height", label: "Height", min: 0.1, max: 1.2, step: 0.02, default: 0.3 },
    { key: "bodyDiameter", label: "Body diameter", min: 0.04, max: 0.4, step: 0.01, default: 0.09 },
    { key: "neckDiameter", label: "Neck diameter", min: 0.01, max: 0.2, step: 0.005, default: 0.035 },
    { key: "neckRatio", label: "Neck ratio", min: 0.1, max: 0.6, step: 0.02, default: 0.3 },
  ],
  build(scene, name, params, color) {
    const h = params.height ?? 0.3;
    const bd = params.bodyDiameter ?? 0.09;
    const nd = params.neckDiameter ?? 0.035;
    const neckRatio = Math.min(0.9, Math.max(0.1, params.neckRatio ?? 0.3));

    const neckH = h * neckRatio;
    const shoulderH = h * 0.12;
    const bodyH = h - neckH - shoulderH;

    const body = cyl(scene, `${name}_body`, bodyH, bd, bd, 0, bodyH / 2, 0, 28);
    const shoulder = cyl(scene, `${name}_sh`, shoulderH, nd, bd, 0, bodyH + shoulderH / 2, 0, 28);
    const neck = cyl(scene, `${name}_neck`, neckH, nd, nd, 0, bodyH + shoulderH + neckH / 2, 0, 24);

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [body, shoulder, neck]);
  },
  baseY: (p) => (p.height ?? 0.3) / 2,
};

export const PROPS_PRIMITIVES = [BOTTLE];
