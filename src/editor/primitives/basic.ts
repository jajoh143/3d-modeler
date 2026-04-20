import { MeshBuilder } from "@babylonjs/core";
import type { PrimitiveDef } from "./types";
import { makeMaterial } from "./helpers";

export const BOX: PrimitiveDef = {
  id: "box",
  label: "Box",
  category: "basic",
  icon: "box",
  defaultColor: [0.45, 0.55, 0.9],
  params: [{ key: "size", label: "Size", min: 0.05, max: 20, step: 0.05, default: 1 }],
  build(scene, name, params, color) {
    const size = params.size ?? 1;
    const m = MeshBuilder.CreateBox(name, { size }, scene);
    m.material = makeMaterial(scene, name, color);
    return m;
  },
  baseY: (p) => (p.size ?? 1) / 2,
};

export const SPHERE: PrimitiveDef = {
  id: "sphere",
  label: "Sphere",
  category: "basic",
  icon: "circle",
  defaultColor: [0.95, 0.55, 0.35],
  params: [
    { key: "diameter", label: "Diameter", min: 0.05, max: 20, step: 0.05, default: 1 },
  ],
  build(scene, name, params, color) {
    const diameter = params.diameter ?? 1;
    const m = MeshBuilder.CreateSphere(name, { diameter, segments: 24 }, scene);
    m.material = makeMaterial(scene, name, color);
    return m;
  },
  baseY: (p) => (p.diameter ?? 1) / 2,
};

export const CYLINDER: PrimitiveDef = {
  id: "cylinder",
  label: "Cylinder",
  category: "basic",
  icon: "cylinder",
  defaultColor: [0.55, 0.85, 0.45],
  params: [
    { key: "height", label: "Height", min: 0.05, max: 20, step: 0.05, default: 1 },
    { key: "diameter", label: "Diameter", min: 0.05, max: 20, step: 0.05, default: 1 },
  ],
  build(scene, name, params, color) {
    const height = params.height ?? 1;
    const diameter = params.diameter ?? 1;
    const m = MeshBuilder.CreateCylinder(
      name,
      { height, diameter, tessellation: 32 },
      scene,
    );
    m.material = makeMaterial(scene, name, color);
    return m;
  },
  baseY: (p) => (p.height ?? 1) / 2,
};

export const GROUND: PrimitiveDef = {
  id: "ground",
  label: "Ground",
  category: "basic",
  icon: "square",
  defaultColor: [0.26, 0.27, 0.3],
  params: [
    { key: "width", label: "Width", min: 1, max: 200, step: 1, default: 20 },
    { key: "height", label: "Depth", min: 1, max: 200, step: 1, default: 20 },
  ],
  build(scene, name, params, color) {
    const width = params.width ?? 20;
    const height = params.height ?? 20;
    const m = MeshBuilder.CreateGround(name, { width, height, subdivisions: 1 }, scene);
    m.material = makeMaterial(scene, name, color);
    return m;
  },
  baseY: () => 0,
};

export const BASIC_PRIMITIVES = [BOX, SPHERE, CYLINDER, GROUND];
