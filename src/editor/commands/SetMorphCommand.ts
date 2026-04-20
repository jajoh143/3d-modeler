import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";

/** Set a single morph influence on a humanoid mesh. */
export class SetMorphCommand implements Command {
  readonly label: string;

  constructor(
    private readonly id: string,
    private readonly morphKey: string,
    private readonly oldValue: number,
    private readonly newValue: number,
  ) {
    this.label = `Morph ${morphKey}`;
  }

  execute(ctx: CommandContext): void {
    apply(ctx, this.id, this.morphKey, this.newValue);
  }

  undo(ctx: CommandContext): void {
    apply(ctx, this.id, this.morphKey, this.oldValue);
  }
}

function apply(ctx: CommandContext, id: string, key: string, value: number): void {
  const mesh = ctx.editor.registry.getMesh(id) as Mesh | undefined;
  if (!mesh) return;
  const mgr = mesh.morphTargetManager;
  if (mgr) {
    for (let i = 0; i < mgr.numTargets; i++) {
      const t = mgr.getTarget(i);
      if (t.name === key) t.influence = value;
    }
  }
  const meta = mesh.metadata ?? {};
  const morphs = { ...((meta.morphs as Record<string, number> | undefined) ?? {}) };
  morphs[key] = value;
  mesh.metadata = { ...meta, morphs };

  const s = ctx.store.getState();
  s.setDirty(true);
  s.bumpRevision();
}
