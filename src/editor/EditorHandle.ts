import type { EditorScene } from "./engine/Scene";

let current: EditorScene | null = null;

export function setEditor(e: EditorScene | null): void {
  current = e;
}

export function getEditor(): EditorScene | null {
  return current;
}

export function requireEditor(): EditorScene {
  if (!current) throw new Error("Editor not initialized");
  return current;
}
