import { Vector3, type Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";

/** Set one bone's local euler rotation on a rigged mesh (e.g. humanoid). */
export class SetBoneRotationCommand implements Command {
  readonly label: string;

  constructor(
    private readonly id: string,
    private readonly boneName: string,
    private readonly oldRot: [number, number, number],
    private readonly newRot: [number, number, number],
  ) {
    this.label = `Pose ${boneName.replace(/^mixamorig:/, "")}`;
  }

  execute(ctx: CommandContext): void {
    apply(ctx, this.id, this.boneName, this.newRot);
  }

  undo(ctx: CommandContext): void {
    apply(ctx, this.id, this.boneName, this.oldRot);
  }
}

function apply(
  ctx: CommandContext,
  id: string,
  boneName: string,
  rot: [number, number, number],
): void {
  const mesh = ctx.editor.registry.getMesh(id) as Mesh | undefined;
  if (!mesh?.skeleton) return;
  const bone = mesh.skeleton.bones.find((b) => b.name === boneName);
  if (!bone) return;
  bone.setRotation(new Vector3(rot[0], rot[1], rot[2]));

  const meta = mesh.metadata ?? {};
  const pose = { ...((meta.pose as Record<string, [number, number, number]> | undefined) ?? {}) };
  if (rot[0] === 0 && rot[1] === 0 && rot[2] === 0) delete pose[boneName];
  else pose[boneName] = [...rot] as [number, number, number];
  mesh.metadata = { ...meta, pose };

  const s = ctx.store.getState();
  s.setDirty(true);
  s.bumpRevision();
}
