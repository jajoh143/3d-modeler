import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext, TransformTuple } from "./types";
import { snapshotTransform } from "./types";
import {
  createPrimitiveMesh,
  readColor,
  readKind,
  readParams,
  type PrimitiveSpec,
} from "../engine/factory";
import type { SceneNode } from "../../state/editorStore";

interface Snapshot {
  node: SceneNode;
  transform: TransformTuple;
  spec: PrimitiveSpec;
}

export class DeleteNodeCommand implements Command {
  readonly label = "Delete";
  private snapshot: Snapshot | null = null;

  constructor(private readonly id: string) {}

  execute(ctx: CommandContext): void {
    const { editor, store } = ctx;
    const node = store.getState().nodes[this.id];
    const mesh = editor.registry.getMesh(this.id) as Mesh | undefined;
    if (!node || !mesh) return;
    this.snapshot = {
      node,
      transform: snapshotTransform(mesh),
      spec: {
        kind: readKind(mesh) ?? node.kind,
        params: readParams(mesh),
        color: readColor(mesh),
      },
    };
    editor.registry.unregister(this.id)?.dispose();
    store.getState().removeNode(this.id);
  }

  undo(ctx: CommandContext): void {
    if (!this.snapshot) return;
    const { editor, store } = ctx;
    const s = this.snapshot;
    const mesh = createPrimitiveMesh(editor.scene, s.node.name, {
      ...s.spec,
      position: s.transform[0],
      rotation: s.transform[1],
      scaling: s.transform[2],
    }) as Mesh;
    editor.registry.register(s.node.id, mesh);
    store.getState().addNode(s.node);
  }
}
