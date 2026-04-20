import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  type Mesh,
  type Scene,
} from "@babylonjs/core";
import type { PrimitiveKind } from "../../state/editorStore";

export interface PrimitiveSpec {
  kind: PrimitiveKind;
  params?: Record<string, number>;
  color?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scaling?: [number, number, number];
}

export const DEFAULT_COLORS: Record<PrimitiveKind, [number, number, number]> = {
  box: [0.35, 0.55, 0.95],
  sphere: [0.95, 0.55, 0.35],
  cylinder: [0.55, 0.85, 0.45],
  ground: [0.25, 0.26, 0.28],
};

export const DEFAULT_PARAMS: Record<PrimitiveKind, Record<string, number>> = {
  box: { size: 1 },
  sphere: { diameter: 1 },
  cylinder: { height: 1, diameter: 1 },
  ground: { width: 20, height: 20 },
};

export function createPrimitiveMesh(
  scene: Scene,
  name: string,
  spec: PrimitiveSpec,
): Mesh {
  const params = { ...DEFAULT_PARAMS[spec.kind], ...spec.params };
  let mesh: Mesh;
  switch (spec.kind) {
    case "box":
      mesh = MeshBuilder.CreateBox(name, { size: params.size }, scene);
      break;
    case "sphere":
      mesh = MeshBuilder.CreateSphere(name, { diameter: params.diameter }, scene);
      break;
    case "cylinder":
      mesh = MeshBuilder.CreateCylinder(
        name,
        { height: params.height, diameter: params.diameter },
        scene,
      );
      break;
    case "ground":
      mesh = MeshBuilder.CreateGround(
        name,
        { width: params.width, height: params.height, subdivisions: 1 },
        scene,
      );
      break;
  }

  const color = spec.color ?? DEFAULT_COLORS[spec.kind];
  const mat = new StandardMaterial(`${name}_mat`, scene);
  mat.diffuseColor = new Color3(color[0], color[1], color[2]);
  mesh.material = mat;

  if (spec.position) mesh.position.set(...spec.position);
  else if (spec.kind === "box" || spec.kind === "sphere")
    mesh.position.y = (params.size ?? params.diameter ?? 1) / 2;
  else if (spec.kind === "cylinder") mesh.position.y = params.height / 2;

  if (spec.rotation) mesh.rotation.set(...spec.rotation);
  if (spec.scaling) mesh.scaling.set(...spec.scaling);

  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    primitive: { kind: spec.kind, params, color },
  };
  return mesh;
}

export function readColor(mesh: Mesh): [number, number, number] {
  const mat = mesh.material as StandardMaterial | null;
  if (!mat || !("diffuseColor" in mat)) return [1, 1, 1];
  return [mat.diffuseColor.r, mat.diffuseColor.g, mat.diffuseColor.b];
}

export function writeColor(mesh: Mesh, color: [number, number, number]): void {
  const mat = mesh.material as StandardMaterial | null;
  if (!mat) return;
  mat.diffuseColor = new Color3(color[0], color[1], color[2]);
  const md = mesh.metadata?.primitive;
  if (md) md.color = color;
}
