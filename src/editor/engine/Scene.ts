import {
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  Vector3,
  type Mesh,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";

import { NodeRegistry } from "./NodeRegistry";
import { CameraRig } from "./CameraRig";
import { SelectionRig } from "./SelectionRig";
import { GizmoRig } from "./GizmoRig";
import { CommandBus } from "../commands/CommandBus";
import { TransformNodeCommand } from "../commands/TransformNodeCommand";
import type { CommandContext } from "../commands/types";
import type { EditorState } from "../../state/editorStore";
import type { CameraMode, ToolMode } from "../tools/types";

export interface StoreApi {
  getState(): EditorState;
  setState(partial: Partial<EditorState> | ((s: EditorState) => Partial<EditorState>)): void;
}

export class EditorScene {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly registry = new NodeRegistry();
  readonly cameraRig: CameraRig;
  readonly selectionRig: SelectionRig;
  readonly gizmoRig: GizmoRig;
  readonly bus: CommandBus;
  readonly store: StoreApi;

  private gridMesh: Mesh | null = null;
  private readonly onResize = () => this.engine.resize();

  constructor(canvas: HTMLCanvasElement, store: StoreApi) {
    this.store = store;
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.09, 0.1, 0.11, 1.0);

    this.cameraRig = new CameraRig(this.scene, canvas);

    const key = new HemisphericLight("key", new Vector3(0.4, 1, 0.3), this.scene);
    key.intensity = 0.9;
    const fill = new HemisphericLight("fill", new Vector3(-0.5, -0.2, -0.4), this.scene);
    fill.intensity = 0.3;

    this.buildGrid();

    this.selectionRig = new SelectionRig(this.scene, this.registry, (ids, additive) => {
      const s = store.getState();
      const cur = s.selectedIds;
      if (additive && ids.length === 1) {
        const id = ids[0];
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        s.setSelected(next);
      } else {
        s.setSelected(ids);
      }
    });

    const ctx: CommandContext = { editor: this, store };
    this.gizmoRig = new GizmoRig(this.scene, ({ nodeId, pre, post }) => {
      this.bus.pushExecuted(new TransformNodeCommand(nodeId, pre, post));
    });
    this.bus = new CommandBus(ctx, () => {
      store.getState().setUndoState(this.bus.canUndo(), this.bus.canRedo());
    });
  }

  private buildGrid(): void {
    const grid = MeshBuilder.CreateGround("__grid", { width: 50, height: 50 }, this.scene);
    grid.isPickable = false;
    const mat = new GridMaterial("__grid_mat", this.scene);
    mat.gridRatio = 0.5;
    mat.majorUnitFrequency = 10;
    mat.minorUnitVisibility = 0.35;
    mat.mainColor = new Color3(0.15, 0.16, 0.18);
    mat.lineColor = new Color3(0.45, 0.47, 0.52);
    mat.opacity = 0.98;
    grid.material = mat;
    this.gridMesh = grid;
  }

  start(): void {
    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener("resize", this.onResize);
  }

  setTool(tool: ToolMode): void {
    this.gizmoRig.setTool(tool);
    this.updateGizmoAttachment();
  }

  setCameraMode(mode: CameraMode): void {
    this.cameraRig.setMode(mode);
  }

  setSnap(enabled: boolean, size: number): void {
    const t = enabled ? size : 0;
    const r = enabled ? Math.PI / 12 : 0; // 15°
    this.gizmoRig.setSnap(t, r);
  }

  syncSelection(selectedIds: string[]): void {
    const meshes = selectedIds
      .map((id) => this.registry.getMesh(id))
      .filter((m): m is NonNullable<typeof m> => !!m);
    this.selectionRig.setHighlights(meshes);
    this.updateGizmoAttachment();
  }

  private updateGizmoAttachment(): void {
    const ids = this.store.getState().selectedIds;
    if (ids.length !== 1) {
      this.gizmoRig.attachToNode(null, null);
      return;
    }
    const mesh = this.registry.getMesh(ids[0]);
    this.gizmoRig.attachToNode(mesh ? ids[0] : null, mesh ?? null);
  }

  resetScene(): void {
    this.gizmoRig.attachToNode(null, null);
    this.selectionRig.setHighlights([]);
    for (const m of this.registry.allMeshes()) m.dispose();
    this.registry.clear();
    this.bus.clear();
  }

  focusSelected(): void {
    const id = this.store.getState().selectedIds[0];
    if (!id) return;
    const mesh = this.registry.getMesh(id);
    if (!mesh) return;
    const bb = mesh.getBoundingInfo().boundingSphere;
    this.cameraRig.focusOn(bb.centerWorld, Math.max(bb.radiusWorld * 2.5, 1));
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.selectionRig.dispose();
    this.gizmoRig.dispose();
    this.cameraRig.dispose();
    this.registry.clear();
    this.gridMesh?.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
