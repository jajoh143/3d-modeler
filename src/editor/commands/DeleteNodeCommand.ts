import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext, TransformTuple } from "./types";
import { snapshotTransform } from "./types";
import {
  createPrimitiveMesh,
  readColor,
  type PrimitiveSpec,
} from "../engine/factory";
import type { PrimitiveKind, SceneNode } from "../../state/editorStore";

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
    const md = mesh.metadata?.primitive as
      | { kind: PrimitiveKind; params: Record<string, number>; color: [number, number, number] }
      | undefined;
    this.snapshot = {
      node,
      transform: snapshotTransform(mesh),
      spec: {
        kind: node.kind,
        params: md?.params,
        color: md?.color ?? readColor(mesh),
      },
    };
    editor.registry.unregister(this.id)?.dispose();
    store.getState().removeNode(this.id);
  }

  undo(ctx: CommandContext): void {
    if (!this.snapshot) return;
    const { editor, store } = ctx;
    const s = this.snapshot;
    const mesh = createPrimitiveMesh(editor.scene, s.node.name, s.spec) as Mesh;
    mesh.position.set(s.transform[0][0], s.transform[0][1], s.transform[0][2]);
    mesh.rotation.set(s.transform[1][0], s.transform[1][1], s.transform[1][2]);
    mesh.scaling.set(s.transform[2][0], s.transform[2][1], s.transform[2][2]);
    editor.registry.register(s.node.id, mesh);
    store.getState().addNode(s.node);
  }
}
