import type { AbstractMesh } from "@babylonjs/core";
import type { EditorScene } from "../engine/Scene";
import type { EditorState } from "../../state/editorStore";

export interface CommandContext {
  editor: EditorScene;
  store: {
    getState: () => EditorState;
    setState: (partial: Partial<EditorState>) => void;
  };
}

export interface Command {
  readonly label: string;
  execute(ctx: CommandContext): void;
  undo(ctx: CommandContext): void;
}

export type TransformTuple = [
  position: [number, number, number],
  rotation: [number, number, number],
  scaling: [number, number, number],
];

export function snapshotTransform(mesh: AbstractMesh): TransformTuple {
  return [
    [mesh.position.x, mesh.position.y, mesh.position.z],
    [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
    [mesh.scaling.x, mesh.scaling.y, mesh.scaling.z],
  ];
}

export function applyTransform(mesh: AbstractMesh, t: TransformTuple): void {
  mesh.position.set(t[0][0], t[0][1], t[0][2]);
  mesh.rotation.set(t[1][0], t[1][1], t[1][2]);
  mesh.scaling.set(t[2][0], t[2][1], t[2][2]);
}
