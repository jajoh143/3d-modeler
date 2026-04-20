import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  Vector4,
  type Scene,
} from "@babylonjs/core";
import type { RGB } from "./types";

export function makeMaterial(scene: Scene, name: string, color: RGB): StandardMaterial {
  const mat = new StandardMaterial(`${name}_mat`, scene);
  mat.diffuseColor = new Color3(color[0], color[1], color[2]);
  mat.specularColor = new Color3(0.05, 0.05, 0.05);
  return mat;
}

/**
 * Merge an array of parts into a single mesh that shares one material.
 * Part meshes are disposed during merge.
 */
export function mergeCompound(
  _scene: Scene,
  name: string,
  material: StandardMaterial,
  parts: Mesh[],
): Mesh {
  for (const p of parts) p.material = material;
  const merged = Mesh.MergeMeshes(parts, true, true, undefined, false, false);
  if (!merged) throw new Error(`${name}: failed to merge ${parts.length} parts`);
  merged.name = name;
  merged.material = material;
  return merged;
}

export function box(
  scene: Scene,
  name: string,
  w: number,
  h: number,
  d: number,
  cx = 0,
  cy = 0,
  cz = 0,
): Mesh {
  const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  m.position.set(cx, cy, cz);
  return m;
}

export function cyl(
  scene: Scene,
  name: string,
  h: number,
  dTop: number,
  dBot: number,
  cx = 0,
  cy = 0,
  cz = 0,
  tess = 24,
): Mesh {
  const m = MeshBuilder.CreateCylinder(
    name,
    { height: h, diameterTop: dTop, diameterBottom: dBot, tessellation: tess },
    scene,
  );
  m.position.set(cx, cy, cz);
  return m;
}

/** Right-triangle ramp: base w (x) × d (z), rises from z=-d/2 to z=+d/2 by height h. */
export function ramp(scene: Scene, name: string, w: number, h: number, d: number): Mesh {
  const shape = [
    new Vector3(-d / 2, 0, 0),
    new Vector3(d / 2, 0, 0),
    new Vector3(d / 2, h, 0),
  ];
  const m = MeshBuilder.ExtrudePolygon(
    name,
    {
      shape,
      depth: w,
      sideOrientation: Mesh.DOUBLESIDE,
      faceUV: [new Vector4(0, 0, 1, 1), new Vector4(0, 0, 1, 1), new Vector4(0, 0, 1, 1)],
    },
    scene,
  );
  m.rotation.x = -Math.PI / 2;
  m.bakeCurrentTransformIntoVertices();
  m.position.y = 0;
  return m;
}
