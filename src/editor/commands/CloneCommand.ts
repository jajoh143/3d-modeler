import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";
import { snapshotTransform } from "./types";
import { createPrimitiveMesh, readColor, readKind, readParams } from "../engine/factory";

/** Clone the given source node; the new node gets a fresh id and a small offset. */
export class CloneCommand implements Command {
  readonly label = "Clone";
  constructor(
    private readonly sourceId: string,
    private readonly newId: string,
    private readonly newName: string,
    private readonly offset: [number, number, number] = [0.5, 0, 0.5],
  ) {}

  execute(ctx: CommandContext): void {
    const { editor, store } = ctx;
    const src = editor.registry.getMesh(this.sourceId) as Mesh | undefined;
    if (!src) return;
    const kind = readKind(src);
    if (!kind) return;
    const srcNode = store.getState().nodes[this.sourceId];
    const t = snapshotTransform(src);

    const mesh = createPrimitiveMesh(editor.scene, this.newName, {
      kind,
      params: readParams(src),
      color: readColor(src),
      position: [t[0][0] + this.offset[0], t[0][1] + this.offset[1], t[0][2] + this.offset[2]],
      rotation: t[1],
      scaling: t[2],
    }) as Mesh;
    editor.registry.register(this.newId, mesh);

    const s = store.getState();
    s.addNode({
      id: this.newId,
      name: this.newName,
      kind,
      parentId: srcNode?.parentId ?? null,
      visible: true,
    });
    s.setSelected([this.newId]);
  }

  undo(ctx: CommandContext): void {
    const { editor, store } = ctx;
    editor.registry.unregister(this.newId)?.dispose();
    store.getState().removeNode(this.newId);
  }
}
