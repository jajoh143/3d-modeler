import { GLTF2Export } from "@babylonjs/serializers";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import type { EditorScene } from "../engine/Scene";

const FILTERS = [{ name: "glTF Binary", extensions: ["glb"] }];

/**
 * Prompt for a path and write out a GLB of the current scene (excluding grid / utility meshes).
 * Returns the path written, or null if the user cancelled.
 */
export async function exportSceneGlb(editor: EditorScene): Promise<string | null> {
  const path = await save({
    title: "Export GLB",
    defaultPath: `${editor.store.getState().projectName}.glb`,
    filters: FILTERS,
  });
  if (!path) return null;

  const registered = new Set<unknown>(editor.registry.allMeshes());
  const data = await GLTF2Export.GLBAsync(editor.scene, baseName(path), {
    shouldExportNode: (node) => registered.has(node),
  });

  const files = data.glTFFiles;
  const key = Object.keys(files).find((k) => k.toLowerCase().endsWith(".glb"));
  if (!key) throw new Error("Export produced no GLB payload");
  const blob = files[key] as Blob;
  const buf = new Uint8Array(await blob.arrayBuffer());
  await invoke("save_binary_file", { path, bytes: Array.from(buf) });
  return path;
}

function baseName(path: string): string {
  const last = path.split(/[\\/]/).pop() ?? "scene.glb";
  return last.replace(/\.glb$/i, "");
}
