import type { Mesh } from "@babylonjs/core";
import type { EditorScene } from "../engine/Scene";
import { readColor, readMaterial, readParams, type MaterialState } from "../engine/factory";
import type { PrimitiveKind } from "../../state/editorStore";

export const PROJECT_FILE_VERSION = 1 as const;

export interface StoredNode {
  id: string;
  name: string;
  kind: PrimitiveKind;
  parentId: string | null;
  visible: boolean;
  params: Record<string, number>;
  color: [number, number, number];
  /** PBR overrides (metallic/roughness/textures). Default material state omitted. */
  material?: MaterialState;
  /** Present only for kinds that back a MorphTargetManager (e.g. humanoid). */
  morphs?: Record<string, number>;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scaling: [number, number, number];
  };
}

export interface ProjectFileV1 {
  version: typeof PROJECT_FILE_VERSION;
  name: string;
  createdAt: string;
  nodes: StoredNode[];
  rootOrder: string[];
}

export function serializeProject(editor: EditorScene, name: string): ProjectFileV1 {
  const s = editor.store.getState();
  const nodes: StoredNode[] = [];
  for (const id of s.rootOrder) {
    const n = s.nodes[id];
    if (!n) continue;
    const mesh = editor.registry.getMesh(id) as Mesh | undefined;
    if (!mesh) continue;
    const morphs = mesh.metadata?.morphs as Record<string, number> | undefined;
    const material = readMaterial(mesh);
    nodes.push({
      id: n.id,
      name: n.name,
      kind: n.kind,
      parentId: n.parentId,
      visible: n.visible,
      params: readParams(mesh),
      color: readColor(mesh),
      ...(isDefaultMaterial(material) ? {} : { material }),
      ...(morphs ? { morphs: { ...morphs } } : {}),
      transform: {
        position: [mesh.position.x, mesh.position.y, mesh.position.z],
        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        scaling: [mesh.scaling.x, mesh.scaling.y, mesh.scaling.z],
      },
    });
  }
  return {
    version: PROJECT_FILE_VERSION,
    name,
    createdAt: new Date().toISOString(),
    nodes,
    rootOrder: [...s.rootOrder],
  };
}

function isDefaultMaterial(m: MaterialState): boolean {
  return (
    m.metallic === 0 &&
    m.roughness === 0.7 &&
    !m.textures.base &&
    !m.textures.metallicRoughness &&
    !m.textures.normal &&
    !m.textures.occlusion
  );
}

export function parseProjectJson(json: string): ProjectFileV1 {
  const data = JSON.parse(json) as ProjectFileV1;
  if (!data || typeof data !== "object") throw new Error("Not a project file");
  if (data.version !== PROJECT_FILE_VERSION)
    throw new Error(`Unsupported project version: ${(data as { version?: unknown }).version}`);
  if (!Array.isArray(data.nodes)) throw new Error("Missing nodes");
  return data;
}
