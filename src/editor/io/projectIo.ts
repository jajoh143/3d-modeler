import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { EditorScene } from "../engine/Scene";
import { parseProjectJson, serializeProject, type ProjectFileV1 } from "./ProjectFile";
import { loadProjectInto } from "./loadProject";

const FILTERS = [{ name: "3D Modeler Project", extensions: ["3dmproj", "json"] }];

function projectBaseName(path: string | null, fallback = "Untitled"): string {
  if (!path) return fallback;
  const last = path.split(/[\\/]/).pop() ?? fallback;
  return last.replace(/\.(3dmproj|json)$/i, "");
}

export async function saveProjectAs(editor: EditorScene): Promise<string | null> {
  const path = await save({
    title: "Save Project As",
    defaultPath: `${editor.store.getState().projectName}.3dmproj`,
    filters: FILTERS,
  });
  if (!path) return null;
  return writeProjectTo(editor, path);
}

export async function saveProject(editor: EditorScene): Promise<string | null> {
  const existing = editor.store.getState().projectPath;
  if (!existing) return saveProjectAs(editor);
  return writeProjectTo(editor, existing);
}

async function writeProjectTo(editor: EditorScene, path: string): Promise<string> {
  const name = projectBaseName(path);
  const data = serializeProject(editor, name);
  const contents = JSON.stringify(data, null, 2);
  await invoke("save_project_file", { path, contents });
  editor.store.getState().setProject(path, name);
  return path;
}

export async function openProject(editor: EditorScene): Promise<string | null> {
  const picked = await open({
    title: "Open Project",
    multiple: false,
    directory: false,
    filters: FILTERS,
  });
  if (!picked) return null;
  const path = Array.isArray(picked) ? picked[0] : picked;
  if (typeof path !== "string") return null;
  const text = await invoke<string>("load_project_file", { path });
  const data: ProjectFileV1 = parseProjectJson(text);
  loadProjectInto(editor, data);
  editor.store.getState().setProject(path, projectBaseName(path, data.name));
  return path;
}

export function newProject(editor: EditorScene): void {
  editor.resetScene();
  editor.store.getState().replaceAll({}, []);
  editor.store.getState().setProject(null, "Untitled");
}
