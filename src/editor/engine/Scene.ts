import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";

export class EditorScene {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;

  private readonly onResize = () => this.engine.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.10, 0.11, 0.12, 1.0);

    this.camera = new ArcRotateCamera(
      "cam",
      Math.PI / 3,
      Math.PI / 3,
      6,
      Vector3.Zero(),
      this.scene,
    );
    this.camera.attachControl(canvas, true);
    this.camera.wheelDeltaPercentage = 0.01;
    this.camera.lowerRadiusLimit = 0.5;
    this.camera.upperRadiusLimit = 200;

    const light = new HemisphericLight("hemi", new Vector3(0.4, 1, 0.2), this.scene);
    light.intensity = 0.9;

    MeshBuilder.CreateGround("ground", { width: 20, height: 20, subdivisions: 1 }, this.scene);

    const cube = MeshBuilder.CreateBox("cube", { size: 1 }, this.scene);
    cube.position.y = 0.5;
    const mat = new StandardMaterial("cubeMat", this.scene);
    mat.diffuseColor = new Color3(0.35, 0.55, 0.95);
    cube.material = mat;
  }

  start() {
    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener("resize", this.onResize);
  }

  dispose() {
    window.removeEventListener("resize", this.onResize);
    this.scene.dispose();
    this.engine.dispose();
  }
}
