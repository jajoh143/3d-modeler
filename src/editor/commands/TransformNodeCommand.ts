import type { Command, CommandContext, TransformTuple } from "./types";
import { applyTransform } from "./types";

export class TransformNodeCommand implements Command {
  readonly label = "Transform";

  constructor(
    private readonly id: string,
    private readonly pre: TransformTuple,
    private readonly post: TransformTuple,
  ) {}

  execute(ctx: CommandContext): void {
    const mesh = ctx.editor.registry.getMesh(this.id);
    if (!mesh) return;
    applyTransform(mesh, this.post);
    ctx.store.getState().setDirty(true);
  }

  undo(ctx: CommandContext): void {
    const mesh = ctx.editor.registry.getMesh(this.id);
    if (!mesh) return;
    applyTransform(mesh, this.pre);
    ctx.store.getState().setDirty(true);
  }
}
