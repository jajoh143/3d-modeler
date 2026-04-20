import type { Mesh } from "@babylonjs/core";
import type { Command, CommandContext } from "./types";
import { snapshotTransform, applyTransform, type TransformTuple } from "./types";
import { createPrimitiveMesh, readColor, readKind } from "../engine/factory";

/**
 * Rebuild a procedural mesh with new parameters, preserving transform + color.
 * The mesh identity (node id) stays the same; selection/gizmo attachment is refreshed.
 */
export class UpdateParamsCommand implements Command {
  readonly label = "Update parameters";
  private preParams: Record<string, number> | null = null;
  private preTransform: TransformTuple | null = null;

  constructor(
    private readonly id: string,
    private readonly nextParams: Record<string, number>,
  ) {}

  execute(ctx: CommandContext): void {
    const { editor } = ctx;
    const mesh = editor.registry.getMesh(this.id) as Mesh | undefined;
    if (!mesh) return;
    const kind = readKind(mesh);
    if (!kind) return;

    const prev = (mesh.metadata?.params ?? {}) as Record<string, number>;
    this.preParams = { ...prev };
    this.preTransform = snapshotTransform(mesh);

    rebuild(ctx, this.id, mesh, kind, this.nextParams, this.preTransform);
  }

  undo(ctx: CommandContext): void {
    if (!this.preParams || !this.preTransform) return;
    const { editor } = ctx;
    const mesh = editor.registry.getMesh(this.id) as Mesh | undefined;
    if (!mesh) return;
    const kind = readKind(mesh);
    if (!kind) return;
    rebuild(ctx, this.id, mesh, kind, this.preParams, this.preTransform);
  }
}

function rebuild(
  ctx: CommandContext,
  id: string,
  oldMesh: Mesh,
  kind: string,
  params: Record<string, number>,
  transform: TransformTuple,
): void {
  const { editor, store } = ctx;
  const name = oldMesh.name;
  const color = readColor(oldMesh);
  editor.registry.unregister(id);
  oldMesh.dispose();

  const mesh = createPrimitiveMesh(editor.scene, name, {
    kind,
    params,
    color,
  }) as Mesh;
  applyTransform(mesh, transform);
  editor.registry.register(id, mesh);
  editor.syncSelection(store.getState().selectedIds);

  const s = store.getState();
  s.setDirty(true);
  s.bumpRevision();
}
