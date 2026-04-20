import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";
import { writeColor } from "../engine/factory";

export class SetColorCommand implements Command {
  readonly label = "Change color";

  constructor(
    private readonly id: string,
    private readonly oldColor: [number, number, number],
    private readonly newColor: [number, number, number],
  ) {}

  execute(ctx: CommandContext): void {
    const mesh = ctx.editor.registry.getMesh(this.id) as Mesh | undefined;
    if (mesh) writeColor(mesh, this.newColor);
    ctx.store.getState().setDirty(true);
  }

  undo(ctx: CommandContext): void {
    const mesh = ctx.editor.registry.getMesh(this.id) as Mesh | undefined;
    if (mesh) writeColor(mesh, this.oldColor);
    ctx.store.getState().setDirty(true);
  }
}
