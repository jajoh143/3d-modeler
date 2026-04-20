import type { Mesh, Scene } from "@babylonjs/core";
import type { CategoryId, PrimitiveDef, RGB } from "./types";
import { BASIC_PRIMITIVES } from "./basic";
import { ARCHITECTURE_PRIMITIVES } from "./architecture";
import { FURNITURE_PRIMITIVES } from "./furniture";
import { PROPS_PRIMITIVES } from "./props";

const ALL: PrimitiveDef[] = [
  ...BASIC_PRIMITIVES,
  ...ARCHITECTURE_PRIMITIVES,
  ...FURNITURE_PRIMITIVES,
  ...PROPS_PRIMITIVES,
];

const BY_ID = new Map<string, PrimitiveDef>(ALL.map((p) => [p.id, p]));

export function getPrimitive(id: string): PrimitiveDef | undefined {
  return BY_ID.get(id);
}

export function requirePrimitive(id: string): PrimitiveDef {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown primitive: ${id}`);
  return p;
}

export function allPrimitives(): PrimitiveDef[] {
  return ALL;
}

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  basic: "Basic",
  architecture: "Architecture",
  furniture: "Furniture",
  props: "Props",
};

export const CATEGORY_ORDER: CategoryId[] = ["basic", "architecture", "furniture", "props"];

export function primitivesByCategory(): { category: CategoryId; items: PrimitiveDef[] }[] {
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: ALL.filter((p) => p.category === cat),
  }));
}

export function defaultParams(id: string): Record<string, number> {
  const def = requirePrimitive(id);
  const out: Record<string, number> = {};
  for (const p of def.params) out[p.key] = p.default;
  return out;
}

export function buildPrimitive(
  scene: Scene,
  id: string,
  name: string,
  params: Record<string, number>,
  color: RGB,
): Mesh {
  const def = requirePrimitive(id);
  const mesh = def.build(scene, name, params, color);
  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    kind: id,
    params: { ...params },
    color: [color[0], color[1], color[2]],
  };
  return mesh;
}

export function primitiveBaseY(id: string, params: Record<string, number>): number {
  const def = requirePrimitive(id);
  return def.baseY ? def.baseY(params) : 0;
}
