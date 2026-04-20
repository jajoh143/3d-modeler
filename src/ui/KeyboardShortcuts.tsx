import { useHotkeys } from "react-hotkeys-hook";
import { useEditorStore } from "../state/editorStore";
import { getEditor } from "../editor/EditorHandle";
import { DeleteNodeCommand } from "../editor/commands/DeleteNodeCommand";
import { CloneCommand } from "../editor/commands/CloneCommand";
import { makeId } from "../editor/utils/ids";

/**
 * Global keyboard shortcuts. Rendered once at app level.
 *
 * Tool-mode shortcuts (Q/W/E/R) are gated off while the fly camera is active,
 * since those keys overlap with the fly camera's WASD/Q/E movement bindings.
 */
export function KeyboardShortcuts() {
  const cameraMode = useEditorStore((s) => s.cameraMode);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  const toolHotkeysEnabled = cameraMode === "orbit";

  useHotkeys("q", () => setActiveTool("select"), { enabled: toolHotkeysEnabled });
  useHotkeys("w", () => setActiveTool("translate"), { enabled: toolHotkeysEnabled });
  useHotkeys("e", () => setActiveTool("rotate"), { enabled: toolHotkeysEnabled });
  useHotkeys("r", () => setActiveTool("scale"), { enabled: toolHotkeysEnabled });

  useHotkeys("f", () => {
    const store = useEditorStore.getState();
    if (store.selectedIds.length === 1) {
      getEditor()?.focusSelected();
    } else {
      store.setCameraMode(store.cameraMode === "orbit" ? "fly" : "orbit");
    }
  });

  useHotkeys("mod+z", (e) => {
    e.preventDefault();
    getEditor()?.bus.undo();
  });
  useHotkeys("mod+shift+z", (e) => {
    e.preventDefault();
    getEditor()?.bus.redo();
  });
  useHotkeys("mod+y", (e) => {
    e.preventDefault();
    getEditor()?.bus.redo();
  });

  useHotkeys("delete,backspace", (e) => {
    const ids = useEditorStore.getState().selectedIds;
    if (ids.length === 0) return;
    e.preventDefault();
    const editor = getEditor();
    if (!editor) return;
    for (const id of [...ids]) editor.bus.execute(new DeleteNodeCommand(id));
  });

  useHotkeys("mod+d", (e) => {
    const ids = useEditorStore.getState().selectedIds;
    if (ids.length === 0) return;
    e.preventDefault();
    const editor = getEditor();
    if (!editor) return;
    const newIds: string[] = [];
    for (const id of ids) {
      const src = useEditorStore.getState().nodes[id];
      if (!src) continue;
      const newId = makeId(src.kind);
      const newName = cloneName(src.name);
      editor.bus.execute(new CloneCommand(id, newId, newName));
      newIds.push(newId);
    }
    if (newIds.length) useEditorStore.getState().setSelected(newIds);
  });

  useHotkeys("escape", () => useEditorStore.getState().setSelected([]));

  return null;
}

function cloneName(base: string): string {
  const existing = new Set(Object.values(useEditorStore.getState().nodes).map((n) => n.name));
  const m = /^(.*?)(\.(\d{3}))?$/.exec(base);
  const stem = m?.[1] ?? base;
  let i = 1;
  while (existing.has(`${stem}.${pad(i)}`)) i += 1;
  return `${stem}.${pad(i)}`;
}

function pad(n: number): string {
  return n.toString().padStart(3, "0");
}
