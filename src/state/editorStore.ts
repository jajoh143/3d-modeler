import { create } from "zustand";
import type { CameraMode, ToolMode } from "../editor/tools/types";

export type PrimitiveKind = "box" | "sphere" | "cylinder" | "ground";

export interface SceneNode {
  id: string;
  name: string;
  kind: PrimitiveKind;
  parentId: string | null;
  visible: boolean;
}

export interface EditorState {
  nodes: Record<string, SceneNode>;
  rootOrder: string[];

  selectedIds: string[];
  activeTool: ToolMode;
  cameraMode: CameraMode;

  projectPath: string | null;
  projectName: string;
  dirty: boolean;

  canUndo: boolean;
  canRedo: boolean;

  addNode(node: SceneNode): void;
  removeNode(id: string): void;
  renameNode(id: string, name: string): void;
  setVisible(id: string, visible: boolean): void;
  replaceAll(nodes: Record<string, SceneNode>, rootOrder: string[]): void;

  setSelected(ids: string[]): void;
  setActiveTool(tool: ToolMode): void;
  setCameraMode(mode: CameraMode): void;

  setProject(path: string | null, name: string): void;
  setDirty(dirty: boolean): void;
  setUndoState(canUndo: boolean, canRedo: boolean): void;
}

export const useEditorStore = create<EditorState>((set) => ({
  nodes: {},
  rootOrder: [],

  selectedIds: [],
  activeTool: "translate",
  cameraMode: "orbit",

  projectPath: null,
  projectName: "Untitled",
  dirty: false,

  canUndo: false,
  canRedo: false,

  addNode: (node) =>
    set((s) => ({
      nodes: { ...s.nodes, [node.id]: node },
      rootOrder: node.parentId == null ? [...s.rootOrder, node.id] : s.rootOrder,
      dirty: true,
    })),

  removeNode: (id) =>
    set((s) => {
      const next = { ...s.nodes };
      delete next[id];
      return {
        nodes: next,
        rootOrder: s.rootOrder.filter((x) => x !== id),
        selectedIds: s.selectedIds.filter((x) => x !== id),
        dirty: true,
      };
    }),

  renameNode: (id, name) =>
    set((s) => {
      const n = s.nodes[id];
      if (!n) return {};
      return { nodes: { ...s.nodes, [id]: { ...n, name } }, dirty: true };
    }),

  setVisible: (id, visible) =>
    set((s) => {
      const n = s.nodes[id];
      if (!n) return {};
      return { nodes: { ...s.nodes, [id]: { ...n, visible } }, dirty: true };
    }),

  replaceAll: (nodes, rootOrder) =>
    set(() => ({ nodes, rootOrder, selectedIds: [], dirty: false })),

  setSelected: (ids) => set(() => ({ selectedIds: ids })),
  setActiveTool: (tool) => set(() => ({ activeTool: tool })),
  setCameraMode: (mode) => set(() => ({ cameraMode: mode })),

  setProject: (path, name) =>
    set(() => ({ projectPath: path, projectName: name, dirty: false })),
  setDirty: (dirty) => set(() => ({ dirty })),
  setUndoState: (canUndo, canRedo) => set(() => ({ canUndo, canRedo })),
}));
