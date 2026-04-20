import { Color3, StandardMaterial, type Mesh, type Scene } from "@babylonjs/core";
import type { PrimitiveKind } from "../../state/editorStore";
import {
  buildPrimitive,
  defaultParams,
  primitiveBaseY,
  requirePrimitive,
} from "../primitives/registry";

export interface PrimitiveSpec {
  kind: PrimitiveKind;
  params?: Record<string, number>;
  color?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scaling?: [number, number, number];
}

export function defaultColorFor(kind: PrimitiveKind): [number, number, number] {
  return [...requirePrimitive(kind).defaultColor] as [number, number, number];
}

export function defaultParamsFor(kind: PrimitiveKind): Record<string, number> {
  return defaultParams(kind);
}

export function createPrimitiveMesh(
  scene: Scene,
  name: string,
  spec: PrimitiveSpec,
): Mesh {
  const params = { ...defaultParamsFor(spec.kind), ...(spec.params ?? {}) };
  const color = spec.color ?? defaultColorFor(spec.kind);
  const mesh = buildPrimitive(scene, spec.kind, name, params, color);

  if (spec.position) {
    mesh.position.set(spec.position[0], spec.position[1], spec.position[2]);
  } else {
    mesh.position.y = primitiveBaseY(spec.kind, params);
  }
  if (spec.rotation) mesh.rotation.set(spec.rotation[0], spec.rotation[1], spec.rotation[2]);
  if (spec.scaling) mesh.scaling.set(spec.scaling[0], spec.scaling[1], spec.scaling[2]);

  return mesh;
}

export function readColor(mesh: Mesh): [number, number, number] {
  const md = mesh.metadata?.color as [number, number, number] | undefined;
  if (md && md.length === 3) return [md[0], md[1], md[2]];
  const mat = mesh.material as StandardMaterial | null;
  if (!mat || !("diffuseColor" in mat)) return [1, 1, 1];
  return [mat.diffuseColor.r, mat.diffuseColor.g, mat.diffuseColor.b];
}

export function writeColor(mesh: Mesh, color: [number, number, number]): void {
  const mat = mesh.material as StandardMaterial | null;
  if (mat && "diffuseColor" in mat) {
    mat.diffuseColor = new Color3(color[0], color[1], color[2]);
  }
  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    color: [color[0], color[1], color[2]],
  };
}

export function readParams(mesh: Mesh): Record<string, number> {
  const md = mesh.metadata?.params as Record<string, number> | undefined;
  return md ? { ...md } : {};
}

export function readKind(mesh: Mesh): PrimitiveKind | null {
  const k = mesh.metadata?.kind;
  return typeof k === "string" ? k : null;
}
