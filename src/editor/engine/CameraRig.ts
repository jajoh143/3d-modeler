import {
  ArcRotateCamera,
  UniversalCamera,
  Vector3,
  type Scene,
} from "@babylonjs/core";
import type { CameraMode } from "../tools/types";

export class CameraRig {
  readonly orbit: ArcRotateCamera;
  readonly fly: UniversalCamera;
  private mode: CameraMode = "orbit";

  constructor(
    private readonly scene: Scene,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.orbit = new ArcRotateCamera(
      "cam-orbit",
      Math.PI / 3,
      Math.PI / 3,
      8,
      Vector3.Zero(),
      scene,
    );
    this.orbit.wheelDeltaPercentage = 0.01;
    this.orbit.lowerRadiusLimit = 0.2;
    this.orbit.upperRadiusLimit = 500;
    this.orbit.panningSensibility = 80;
    this.orbit.attachControl(canvas, true);

    this.fly = new UniversalCamera("cam-fly", new Vector3(6, 4, 6), scene);
    this.fly.setTarget(Vector3.Zero());
    this.fly.speed = 0.25;
    this.fly.inertia = 0.5;
    this.fly.angularSensibility = 800;
    // WASD + Q/E
    this.fly.keysUp = [87];
    this.fly.keysDown = [83];
    this.fly.keysLeft = [65];
    this.fly.keysRight = [68];
    this.fly.keysUpward = [69];
    this.fly.keysDownward = [81];

    scene.activeCamera = this.orbit;
  }

  getMode(): CameraMode {
    return this.mode;
  }

  setMode(mode: CameraMode): void {
    if (mode === this.mode) return;
    if (mode === "fly") {
      this.orbit.detachControl();
      this.fly.position.copyFrom(this.orbit.position);
      const forward = this.orbit.target.subtract(this.orbit.position).normalize();
      this.fly.setTarget(this.fly.position.add(forward));
      this.fly.attachControl(this.canvas, true);
      this.scene.activeCamera = this.fly;
    } else {
      this.fly.detachControl();
      this.orbit.setPosition(this.fly.position.clone());
      this.orbit.attachControl(this.canvas, true);
      this.scene.activeCamera = this.orbit;
    }
    this.mode = mode;
  }

  focusOn(position: Vector3, radius = 3): void {
    if (this.mode === "orbit") {
      this.orbit.setTarget(position.clone());
      this.orbit.radius = Math.max(radius, this.orbit.lowerRadiusLimit ?? 0.5);
    } else {
      const forward = this.fly
        .getDirection(new Vector3(0, 0, 1))
        .normalize()
        .scale(radius);
      this.fly.position.copyFrom(position.subtract(forward));
      this.fly.setTarget(position);
    }
  }

  dispose(): void {
    this.orbit.dispose();
    this.fly.dispose();
  }
}
