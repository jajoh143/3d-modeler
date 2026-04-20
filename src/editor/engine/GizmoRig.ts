import {
  GizmoManager,
  UtilityLayerRenderer,
  type AbstractMesh,
  type IPositionGizmo,
  type IRotationGizmo,
  type IScaleGizmo,
  type Scene,
} from "@babylonjs/core";
import type { ToolMode } from "../tools/types";
import { snapshotTransform, type TransformTuple } from "../commands/types";

type DragGizmo = IPositionGizmo | IRotationGizmo | IScaleGizmo;

export interface DragCommitted {
  nodeId: string;
  pre: TransformTuple;
  post: TransformTuple;
}

export class GizmoRig {
  private readonly mgr: GizmoManager;
  private readonly utility: UtilityLayerRenderer;
  private attachedId: string | null = null;
  private attachedMesh: AbstractMesh | null = null;
  private preSnapshot: TransformTuple | null = null;
  private currentTool: ToolMode = "translate";

  constructor(
    scene: Scene,
    private readonly onDragCommit: (d: DragCommitted) => void,
  ) {
    this.utility = new UtilityLayerRenderer(scene);
    this.mgr = new GizmoManager(scene, 1, this.utility);
    this.mgr.usePointerToAttachGizmos = false;

    // Create all three up front so their observables are wireable.
    this.mgr.positionGizmoEnabled = true;
    this.mgr.rotationGizmoEnabled = true;
    this.mgr.scaleGizmoEnabled = true;

    this.wire(this.mgr.gizmos.positionGizmo ?? null);
    this.wire(this.mgr.gizmos.rotationGizmo ?? null);
    this.wire(this.mgr.gizmos.scaleGizmo ?? null);

    // Default: only translate enabled.
    this.setTool("translate");
    this.mgr.attachToMesh(null);
  }

  private wire(g: DragGizmo | null): void {
    if (!g) return;
    g.onDragStartObservable.add(() => {
      if (this.attachedMesh) this.preSnapshot = snapshotTransform(this.attachedMesh);
    });
    g.onDragEndObservable.add(() => {
      if (!this.attachedId || !this.attachedMesh || !this.preSnapshot) return;
      const post = snapshotTransform(this.attachedMesh);
      const pre = this.preSnapshot;
      this.preSnapshot = null;
      if (sameTransform(pre, post)) return;
      this.onDragCommit({ nodeId: this.attachedId, pre, post });
    });
  }

  setTool(tool: ToolMode): void {
    this.currentTool = tool;
    if (tool === "select") {
      this.mgr.positionGizmoEnabled = false;
      this.mgr.rotationGizmoEnabled = false;
      this.mgr.scaleGizmoEnabled = false;
    } else {
      this.mgr.positionGizmoEnabled = tool === "translate";
      this.mgr.rotationGizmoEnabled = tool === "rotate";
      this.mgr.scaleGizmoEnabled = tool === "scale";
    }
    if (this.attachedMesh) this.mgr.attachToMesh(this.attachedMesh);
  }

  attachToNode(id: string | null, mesh: AbstractMesh | null): void {
    this.attachedId = id;
    this.attachedMesh = mesh;
    this.mgr.attachToMesh(mesh);
    // Re-apply tool to ensure correct gizmo visibility after attach.
    this.setTool(this.currentTool);
  }

  dispose(): void {
    this.mgr.dispose();
    this.utility.dispose();
  }
}

function sameTransform(a: TransformTuple, b: TransformTuple): boolean {
  const EPS = 1e-6;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (Math.abs(a[i][j] - b[i][j]) > EPS) return false;
  return true;
}
