import type { Command, CommandContext } from "./types";

export class RenameNodeCommand implements Command {
  readonly label = "Rename";

  constructor(
    private readonly id: string,
    private readonly oldName: string,
    private readonly newName: string,
  ) {}

  execute(ctx: CommandContext): void {
    const mesh = ctx.editor.registry.getMesh(this.id);
    if (mesh) mesh.name = this.newName;
    ctx.store.getState().renameNode(this.id, this.newName);
  }

  undo(ctx: CommandContext): void {
    const mesh = ctx.editor.registry.getMesh(this.id);
    if (mesh) mesh.name = this.oldName;
    ctx.store.getState().renameNode(this.id, this.oldName);
  }
}
