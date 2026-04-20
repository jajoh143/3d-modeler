import {
  Color3,
  PBRMetallicRoughnessMaterial,
  Texture,
  type Mesh,
  type Scene,
} from "@babylonjs/core";
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
  material?: MaterialState;
}

export type TextureSlot = "base" | "metallicRoughness" | "normal" | "occlusion";

export interface MaterialState {
  metallic: number;
  roughness: number;
  textures: Partial<Record<TextureSlot, string>>;
}

export function defaultMaterialState(): MaterialState {
  return { metallic: 0, roughness: 0.7, textures: {} };
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

  if (spec.material) writeMaterial(mesh, spec.material);

  return mesh;
}

function pbrMat(mesh: Mesh): PBRMetallicRoughnessMaterial | null {
  const m = mesh.material;
  return m instanceof PBRMetallicRoughnessMaterial ? m : null;
}

export function readColor(mesh: Mesh): [number, number, number] {
  const md = mesh.metadata?.color as [number, number, number] | undefined;
  if (md && md.length === 3) return [md[0], md[1], md[2]];
  const mat = pbrMat(mesh);
  if (!mat) return [1, 1, 1];
  return [mat.baseColor.r, mat.baseColor.g, mat.baseColor.b];
}

export function writeColor(mesh: Mesh, color: [number, number, number]): void {
  const mat = pbrMat(mesh);
  if (mat) mat.baseColor = new Color3(color[0], color[1], color[2]);
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

export function readMaterial(mesh: Mesh): MaterialState {
  const md = mesh.metadata?.material as MaterialState | undefined;
  if (md) return cloneMaterial(md);
  const mat = pbrMat(mesh);
  if (!mat) return defaultMaterialState();
  return { metallic: mat.metallic, roughness: mat.roughness, textures: {} };
}

export function writeMaterial(mesh: Mesh, state: MaterialState): void {
  const mat = pbrMat(mesh);
  if (mat) {
    mat.metallic = state.metallic;
    mat.roughness = state.roughness;
    syncTexture(mat, "base", state.textures.base);
    syncTexture(mat, "metallicRoughness", state.textures.metallicRoughness);
    syncTexture(mat, "normal", state.textures.normal);
    syncTexture(mat, "occlusion", state.textures.occlusion);
  }
  mesh.metadata = { ...(mesh.metadata ?? {}), material: cloneMaterial(state) };
}

function syncTexture(
  mat: PBRMetallicRoughnessMaterial,
  slot: TextureSlot,
  url: string | undefined,
): void {
  const current = textureFor(mat, slot);
  if (!url) {
    if (current) {
      current.dispose();
      setTextureFor(mat, slot, null);
    }
    return;
  }
  if (current && current.url === url) return;
  if (current) current.dispose();
  const tex = new Texture(url, mat.getScene(), { invertY: slot === "normal" ? false : undefined });
  tex.name = `${mat.name}_${slot}`;
  setTextureFor(mat, slot, tex);
}

function textureFor(
  mat: PBRMetallicRoughnessMaterial,
  slot: TextureSlot,
): Texture | null {
  switch (slot) {
    case "base": return mat.baseTexture as Texture | null;
    case "metallicRoughness": return mat.metallicRoughnessTexture as Texture | null;
    case "normal": return mat.normalTexture as Texture | null;
    case "occlusion": return mat.occlusionTexture as Texture | null;
  }
}

function setTextureFor(
  mat: PBRMetallicRoughnessMaterial,
  slot: TextureSlot,
  tex: Texture | null,
): void {
  switch (slot) {
    case "base": mat.baseTexture = tex; break;
    case "metallicRoughness": mat.metallicRoughnessTexture = tex; break;
    case "normal": mat.normalTexture = tex; break;
    case "occlusion": mat.occlusionTexture = tex; break;
  }
}

function cloneMaterial(s: MaterialState): MaterialState {
  return {
    metallic: s.metallic,
    roughness: s.roughness,
    textures: { ...s.textures },
  };
}
