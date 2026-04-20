import type { Mesh } from "@babylonjs/core";
import type { EditorScene } from "../engine/Scene";
import { createPrimitiveMesh } from "../engine/factory";
import type { ProjectFileV1 } from "./ProjectFile";
import type { SceneNode } from "../../state/editorStore";
import { applyMorphInfluences } from "../../features/humanoid";

/**
 * Replace the editor's current scene with the contents of a project file.
 * Resets the command history — loaded state is the new baseline.
 */
export function loadProjectInto(editor: EditorScene, project: ProjectFileV1): void {
  editor.resetScene();
  const nodesById: Record<string, SceneNode> = {};
  for (const stored of project.nodes) {
    const mesh = createPrimitiveMesh(editor.scene, stored.name, {
      kind: stored.kind,
      params: stored.params,
      color: stored.color,
      position: stored.transform.position,
      rotation: stored.transform.rotation,
      scaling: stored.transform.scaling,
      material: stored.material,
    }) as Mesh;
    if (stored.morphs) {
      applyMorphInfluences(mesh, stored.morphs);
      mesh.metadata = { ...(mesh.metadata ?? {}), morphs: { ...stored.morphs } };
    }
    editor.registry.register(stored.id, mesh);
    nodesById[stored.id] = {
      id: stored.id,
      name: stored.name,
      kind: stored.kind,
      parentId: stored.parentId,
      visible: stored.visible,
    };
  }
  editor.store.getState().replaceAll(nodesById, [...project.rootOrder]);
}
