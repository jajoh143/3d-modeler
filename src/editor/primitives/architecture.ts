import type { PrimitiveDef } from "./types";
import { box, cyl, makeMaterial, mergeCompound, ramp } from "./helpers";

const WALL_COLOR: [number, number, number] = [0.82, 0.80, 0.74];
const TRIM_COLOR: [number, number, number] = [0.72, 0.55, 0.38];
const STONE_COLOR: [number, number, number] = [0.55, 0.55, 0.58];

export const WALL: PrimitiveDef = {
  id: "wall",
  label: "Wall segment",
  category: "architecture",
  icon: "panel",
  defaultColor: WALL_COLOR,
  params: [
    { key: "length", label: "Length", min: 0.5, max: 20, step: 0.25, default: 4 },
    { key: "height", label: "Height", min: 0.5, max: 10, step: 0.25, default: 3 },
    { key: "thickness", label: "Thickness", min: 0.05, max: 1, step: 0.05, default: 0.2 },
  ],
  build(scene, name, params, color) {
    const length = params.length ?? 4;
    const height = params.height ?? 3;
    const thickness = params.thickness ?? 0.2;
    const part = box(scene, `${name}_slab`, length, height, thickness);
    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [part]);
  },
  baseY: (p) => (p.height ?? 3) / 2,
};

export const FLOOR_TILE: PrimitiveDef = {
  id: "floor_tile",
  label: "Floor tile",
  category: "architecture",
  icon: "square",
  defaultColor: [0.55, 0.48, 0.38],
  params: [
    { key: "width", label: "Width", min: 0.25, max: 20, step: 0.25, default: 4 },
    { key: "depth", label: "Depth", min: 0.25, max: 20, step: 0.25, default: 4 },
    { key: "thickness", label: "Thickness", min: 0.02, max: 0.5, step: 0.02, default: 0.08 },
  ],
  build(scene, name, params, color) {
    const w = params.width ?? 4;
    const d = params.depth ?? 4;
    const t = params.thickness ?? 0.08;
    const part = box(scene, `${name}_slab`, w, t, d);
    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [part]);
  },
  baseY: (p) => (p.thickness ?? 0.08) / 2,
};

export const DOORFRAME: PrimitiveDef = {
  id: "doorframe",
  label: "Door frame",
  category: "architecture",
  icon: "door-open",
  defaultColor: TRIM_COLOR,
  params: [
    { key: "opening", label: "Opening width", min: 0.6, max: 3, step: 0.1, default: 1 },
    { key: "height", label: "Height", min: 1.8, max: 4, step: 0.1, default: 2.4 },
    { key: "wallLength", label: "Wall length", min: 1.5, max: 10, step: 0.25, default: 4 },
    { key: "wallHeight", label: "Wall height", min: 2, max: 6, step: 0.25, default: 3 },
    { key: "thickness", label: "Wall thickness", min: 0.05, max: 0.8, step: 0.05, default: 0.2 },
  ],
  build(scene, name, params, color) {
    const openW = params.opening ?? 1;
    const openH = params.height ?? 2.4;
    const wallL = Math.max(openW + 0.5, params.wallLength ?? 4);
    const wallH = Math.max(openH + 0.3, params.wallHeight ?? 3);
    const t = params.thickness ?? 0.2;

    const sideW = (wallL - openW) / 2;
    const topH = wallH - openH;

    const left = box(scene, `${name}_l`, sideW, wallH, t, -(openW / 2 + sideW / 2), wallH / 2, 0);
    const right = box(scene, `${name}_r`, sideW, wallH, t, openW / 2 + sideW / 2, wallH / 2, 0);
    const top = box(scene, `${name}_t`, openW, topH, t, 0, openH + topH / 2, 0);

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [left, right, top]);
  },
  baseY: (p) => (p.wallHeight ?? 3) / 2,
};

export const WINDOW_FRAME: PrimitiveDef = {
  id: "window_frame",
  label: "Window frame",
  category: "architecture",
  icon: "panel",
  defaultColor: TRIM_COLOR,
  params: [
    { key: "openingW", label: "Opening width", min: 0.4, max: 4, step: 0.1, default: 1.4 },
    { key: "openingH", label: "Opening height", min: 0.4, max: 3, step: 0.1, default: 1.2 },
    { key: "sillHeight", label: "Sill height", min: 0.2, max: 2, step: 0.1, default: 1 },
    { key: "wallLength", label: "Wall length", min: 1.5, max: 10, step: 0.25, default: 4 },
    { key: "wallHeight", label: "Wall height", min: 2, max: 6, step: 0.25, default: 3 },
    { key: "thickness", label: "Wall thickness", min: 0.05, max: 0.8, step: 0.05, default: 0.2 },
  ],
  build(scene, name, params, color) {
    const ow = params.openingW ?? 1.4;
    const oh = params.openingH ?? 1.2;
    const sill = params.sillHeight ?? 1;
    const wl = Math.max(ow + 0.6, params.wallLength ?? 4);
    const wh = Math.max(sill + oh + 0.3, params.wallHeight ?? 3);
    const t = params.thickness ?? 0.2;

    const sideW = (wl - ow) / 2;
    const topH = wh - (sill + oh);

    const left = box(scene, `${name}_l`, sideW, wh, t, -(ow / 2 + sideW / 2), wh / 2, 0);
    const right = box(scene, `${name}_r`, sideW, wh, t, ow / 2 + sideW / 2, wh / 2, 0);
    const below = box(scene, `${name}_b`, ow, sill, t, 0, sill / 2, 0);
    const above = box(scene, `${name}_a`, ow, topH, t, 0, sill + oh + topH / 2, 0);

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [left, right, below, above]);
  },
  baseY: (p) => (p.wallHeight ?? 3) / 2,
};

export const PILLAR: PrimitiveDef = {
  id: "pillar",
  label: "Pillar",
  category: "architecture",
  icon: "pillar",
  defaultColor: STONE_COLOR,
  params: [
    { key: "height", label: "Height", min: 0.5, max: 8, step: 0.1, default: 3 },
    { key: "diameter", label: "Diameter", min: 0.1, max: 2, step: 0.05, default: 0.4 },
    { key: "capDiameter", label: "Cap diameter", min: 0.1, max: 3, step: 0.05, default: 0.55 },
    { key: "capHeight", label: "Cap height", min: 0.02, max: 0.5, step: 0.02, default: 0.12 },
  ],
  build(scene, name, params, color) {
    const h = params.height ?? 3;
    const d = params.diameter ?? 0.4;
    const capD = params.capDiameter ?? 0.55;
    const capH = params.capHeight ?? 0.12;
    const shaftH = h - 2 * capH;

    const top = box(scene, `${name}_top`, capD, capH, capD, 0, h - capH / 2, 0);
    const shaft = cyl(scene, `${name}_shaft`, shaftH, d, d, 0, capH + shaftH / 2, 0, 20);
    const base = box(scene, `${name}_base`, capD, capH, capD, 0, capH / 2, 0);

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [base, shaft, top]);
  },
  baseY: (p) => (p.height ?? 3) / 2,
};

export const RAMP: PrimitiveDef = {
  id: "ramp",
  label: "Ramp",
  category: "architecture",
  icon: "triangle",
  defaultColor: [0.45, 0.42, 0.38],
  params: [
    { key: "width", label: "Width", min: 0.5, max: 10, step: 0.25, default: 2 },
    { key: "height", label: "Height", min: 0.1, max: 5, step: 0.1, default: 1 },
    { key: "depth", label: "Run", min: 0.5, max: 10, step: 0.25, default: 2 },
  ],
  build(scene, name, params, color) {
    const w = params.width ?? 2;
    const h = params.height ?? 1;
    const d = params.depth ?? 2;
    const part = ramp(scene, `${name}_part`, w, h, d);
    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [part]);
  },
  baseY: () => 0,
};

export const ARCHITECTURE_PRIMITIVES = [
  WALL,
  FLOOR_TILE,
  DOORFRAME,
  WINDOW_FRAME,
  PILLAR,
  RAMP,
];
