import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";
import { writeMaterial, type MaterialState } from "../engine/factory";

/** Replace a mesh's PBR material settings (metallic / roughness / textures) atomically. */
export class SetMaterialCommand implements Command {
  readonly label = "Edit material";

  constructor(
    private readonly id: string,
    private readonly oldState: MaterialState,
    private readonly newState: MaterialState,
  ) {}

  execute(ctx: CommandContext): void {
    apply(ctx, this.id, this.newState);
  }

  undo(ctx: CommandContext): void {
    apply(ctx, this.id, this.oldState);
  }
}

function apply(ctx: CommandContext, id: string, state: MaterialState): void {
  const mesh = ctx.editor.registry.getMesh(id) as Mesh | undefined;
  if (!mesh) return;
  writeMaterial(mesh, state);
  const s = ctx.store.getState();
  s.setDirty(true);
  s.bumpRevision();
}
