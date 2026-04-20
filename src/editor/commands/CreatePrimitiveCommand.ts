import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";
import type { PrimitiveKind } from "../../state/editorStore";
import { createPrimitiveMesh, type PrimitiveSpec } from "../engine/factory";

export interface CreatePrimitiveInput {
  id: string;
  name: string;
  kind: PrimitiveKind;
  spec: PrimitiveSpec;
}

export class CreatePrimitiveCommand implements Command {
  readonly label: string;

  constructor(private readonly input: CreatePrimitiveInput) {
    this.label = `Create ${input.kind}`;
  }

  execute(ctx: CommandContext): void {
    const { editor, store } = ctx;
    const mesh = createPrimitiveMesh(editor.scene, this.input.name, this.input.spec) as Mesh;
    editor.registry.register(this.input.id, mesh);
    const state = store.getState();
    state.addNode({
      id: this.input.id,
      name: this.input.name,
      kind: this.input.kind,
      parentId: null,
      visible: true,
    });
    state.setSelected([this.input.id]);
  }

  undo(ctx: CommandContext): void {
    const { editor, store } = ctx;
    editor.registry.unregister(this.input.id)?.dispose();
    store.getState().removeNode(this.input.id);
  }
}
