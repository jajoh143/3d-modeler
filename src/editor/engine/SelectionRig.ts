import {
  Color3,
  HighlightLayer,
  PointerEventTypes,
  type AbstractMesh,
  type Observer,
  type PointerInfo,
  type Scene,
  Mesh,
} from "@babylonjs/core";
import type { NodeRegistry } from "./NodeRegistry";

export class SelectionRig {
  private readonly highlight: HighlightLayer;
  private readonly observer: Observer<PointerInfo> | null;
  private readonly color = Color3.FromHexString("#fbbf24");
  private downPos: { x: number; y: number } | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly registry: NodeRegistry,
    private readonly onSelect: (ids: string[], additive: boolean) => void,
  ) {
    this.highlight = new HighlightLayer("sel-hl", scene, {
      blurHorizontalSize: 0.6,
      blurVerticalSize: 0.6,
    });
    this.observer = scene.onPointerObservable.add((pi) => this.handle(pi));
  }

  private handle(pi: PointerInfo): void {
    if (pi.type === PointerEventTypes.POINTERDOWN && pi.event.button === 0) {
      this.downPos = { x: pi.event.clientX, y: pi.event.clientY };
      return;
    }
    if (pi.type !== PointerEventTypes.POINTERUP || pi.event.button !== 0) return;
    const down = this.downPos;
    this.downPos = null;
    if (!down) return;
    const dx = pi.event.clientX - down.x;
    const dy = pi.event.clientY - down.y;
    if (dx * dx + dy * dy > 16) return; // drag, not a click

    const pick = this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (m) => !!this.registry.getId(m),
    );
    const additive = pi.event.shiftKey || pi.event.metaKey || pi.event.ctrlKey;
    if (!pick?.hit || !pick.pickedMesh) {
      this.onSelect([], additive);
      return;
    }
    const id = this.registry.getId(pick.pickedMesh);
    this.onSelect(id ? [id] : [], additive);
  }

  setHighlights(meshes: AbstractMesh[]): void {
    this.highlight.removeAllMeshes();
    for (const m of meshes) {
      if (m instanceof Mesh) this.highlight.addMesh(m, this.color);
    }
  }

  dispose(): void {
    if (this.observer) this.scene.onPointerObservable.remove(this.observer);
    this.highlight.dispose();
  }
}
