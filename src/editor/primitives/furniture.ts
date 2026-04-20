import type { PrimitiveDef } from "./types";
import { box, cyl, makeMaterial, mergeCompound } from "./helpers";

const WOOD: [number, number, number] = [0.58, 0.42, 0.28];
const DARK_WOOD: [number, number, number] = [0.35, 0.24, 0.16];
const FABRIC: [number, number, number] = [0.35, 0.38, 0.48];

export const CHAIR: PrimitiveDef = {
  id: "chair",
  label: "Chair",
  category: "furniture",
  icon: "armchair",
  defaultColor: FABRIC,
  params: [
    { key: "seatWidth", label: "Seat width", min: 0.3, max: 1.2, step: 0.05, default: 0.5 },
    { key: "seatDepth", label: "Seat depth", min: 0.3, max: 1.2, step: 0.05, default: 0.5 },
    { key: "seatHeight", label: "Seat height", min: 0.3, max: 0.8, step: 0.02, default: 0.45 },
    { key: "backHeight", label: "Back height", min: 0.3, max: 1.2, step: 0.05, default: 0.55 },
    { key: "legThickness", label: "Leg thickness", min: 0.02, max: 0.12, step: 0.01, default: 0.06 },
  ],
  build(scene, name, params, color) {
    const sw = params.seatWidth ?? 0.5;
    const sd = params.seatDepth ?? 0.5;
    const sh = params.seatHeight ?? 0.45;
    const bh = params.backHeight ?? 0.55;
    const lt = params.legThickness ?? 0.06;
    const seatT = 0.05;

    const seat = box(scene, `${name}_seat`, sw, seatT, sd, 0, sh - seatT / 2, 0);
    const back = box(scene, `${name}_back`, sw, bh, lt, 0, sh + bh / 2, -(sd / 2 - lt / 2));

    const legY = (sh - seatT) / 2;
    const lx = sw / 2 - lt / 2;
    const lz = sd / 2 - lt / 2;
    const legs = [
      box(scene, `${name}_l1`, lt, sh - seatT, lt, lx, legY, lz),
      box(scene, `${name}_l2`, lt, sh - seatT, lt, -lx, legY, lz),
      box(scene, `${name}_l3`, lt, sh - seatT, lt, lx, legY, -lz),
      box(scene, `${name}_l4`, lt, sh - seatT, lt, -lx, legY, -lz),
    ];

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [seat, back, ...legs]);
  },
  baseY: (p) => {
    const sh = p.seatHeight ?? 0.45;
    const bh = p.backHeight ?? 0.55;
    return (sh + bh) / 2;
  },
};

export const STOOL: PrimitiveDef = {
  id: "stool",
  label: "Stool",
  category: "furniture",
  icon: "stool",
  defaultColor: WOOD,
  params: [
    { key: "seatDiameter", label: "Seat diameter", min: 0.25, max: 0.8, step: 0.05, default: 0.4 },
    { key: "seatThickness", label: "Seat thickness", min: 0.02, max: 0.2, step: 0.01, default: 0.05 },
    { key: "height", label: "Height", min: 0.3, max: 1.2, step: 0.05, default: 0.75 },
    { key: "legThickness", label: "Leg thickness", min: 0.02, max: 0.1, step: 0.01, default: 0.05 },
  ],
  build(scene, name, params, color) {
    const sd = params.seatDiameter ?? 0.4;
    const st = params.seatThickness ?? 0.05;
    const h = params.height ?? 0.75;
    const lt = params.legThickness ?? 0.05;
    const legH = h - st;

    const seat = cyl(scene, `${name}_seat`, st, sd, sd, 0, h - st / 2, 0, 20);
    const lx = sd / 2 - lt;
    const lz = sd / 2 - lt;
    const legs = [
      box(scene, `${name}_l1`, lt, legH, lt, lx, legH / 2, lz),
      box(scene, `${name}_l2`, lt, legH, lt, -lx, legH / 2, lz),
      box(scene, `${name}_l3`, lt, legH, lt, lx, legH / 2, -lz),
      box(scene, `${name}_l4`, lt, legH, lt, -lx, legH / 2, -lz),
    ];

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [seat, ...legs]);
  },
  baseY: (p) => (p.height ?? 0.75) / 2,
};

export const TABLE: PrimitiveDef = {
  id: "table",
  label: "Table",
  category: "furniture",
  icon: "table",
  defaultColor: WOOD,
  params: [
    { key: "width", label: "Width", min: 0.5, max: 4, step: 0.1, default: 1.4 },
    { key: "depth", label: "Depth", min: 0.5, max: 3, step: 0.1, default: 0.9 },
    { key: "height", label: "Height", min: 0.4, max: 1.2, step: 0.02, default: 0.75 },
    { key: "topThickness", label: "Top thickness", min: 0.02, max: 0.15, step: 0.01, default: 0.05 },
    { key: "legThickness", label: "Leg thickness", min: 0.04, max: 0.15, step: 0.01, default: 0.07 },
  ],
  build(scene, name, params, color) {
    const w = params.width ?? 1.4;
    const d = params.depth ?? 0.9;
    const h = params.height ?? 0.75;
    const tt = params.topThickness ?? 0.05;
    const lt = params.legThickness ?? 0.07;
    const legH = h - tt;

    const top = box(scene, `${name}_top`, w, tt, d, 0, h - tt / 2, 0);
    const lx = w / 2 - lt;
    const lz = d / 2 - lt;
    const legs = [
      box(scene, `${name}_l1`, lt, legH, lt, lx, legH / 2, lz),
      box(scene, `${name}_l2`, lt, legH, lt, -lx, legH / 2, lz),
      box(scene, `${name}_l3`, lt, legH, lt, lx, legH / 2, -lz),
      box(scene, `${name}_l4`, lt, legH, lt, -lx, legH / 2, -lz),
    ];

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [top, ...legs]);
  },
  baseY: (p) => (p.height ?? 0.75) / 2,
};

export const DESK: PrimitiveDef = {
  id: "desk",
  label: "Desk",
  category: "furniture",
  icon: "table",
  defaultColor: DARK_WOOD,
  params: [
    { key: "width", label: "Width", min: 0.8, max: 3, step: 0.1, default: 1.6 },
    { key: "depth", label: "Depth", min: 0.5, max: 1.2, step: 0.05, default: 0.7 },
    { key: "height", label: "Height", min: 0.6, max: 1.1, step: 0.02, default: 0.76 },
    { key: "drawerHeight", label: "Drawer height", min: 0.1, max: 0.5, step: 0.02, default: 0.22 },
  ],
  build(scene, name, params, color) {
    const w = params.width ?? 1.6;
    const d = params.depth ?? 0.7;
    const h = params.height ?? 0.76;
    const dh = params.drawerHeight ?? 0.22;
    const tt = 0.04;
    const side = 0.03;
    const panelW = w * 0.35;

    const top = box(scene, `${name}_top`, w, tt, d, 0, h - tt / 2, 0);
    const leftPanel = box(
      scene,
      `${name}_lp`,
      side,
      h - tt,
      d,
      -(w / 2 - side / 2),
      (h - tt) / 2,
      0,
    );
    const back = box(scene, `${name}_bk`, w, h - tt, side, 0, (h - tt) / 2, -(d / 2 - side / 2));
    const drawerBlock = box(
      scene,
      `${name}_dr`,
      panelW,
      dh,
      d - 0.02,
      w / 2 - panelW / 2 - side,
      h - tt - dh / 2,
      0,
    );
    const rightPanel = box(
      scene,
      `${name}_rp`,
      side,
      h - tt - dh,
      d,
      w / 2 - side / 2,
      (h - tt - dh) / 2,
      0,
    );

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [top, leftPanel, rightPanel, back, drawerBlock]);
  },
  baseY: (p) => (p.height ?? 0.76) / 2,
};

export const SHELF: PrimitiveDef = {
  id: "shelf",
  label: "Bookshelf",
  category: "furniture",
  icon: "bookshelf",
  defaultColor: DARK_WOOD,
  params: [
    { key: "width", label: "Width", min: 0.4, max: 3, step: 0.1, default: 1 },
    { key: "depth", label: "Depth", min: 0.2, max: 0.8, step: 0.05, default: 0.3 },
    { key: "height", label: "Height", min: 0.6, max: 3, step: 0.1, default: 1.8 },
    { key: "shelves", label: "Shelves", min: 2, max: 8, step: 1, default: 4 },
    { key: "thickness", label: "Panel thickness", min: 0.02, max: 0.1, step: 0.01, default: 0.03 },
  ],
  build(scene, name, params, color) {
    const w = params.width ?? 1;
    const d = params.depth ?? 0.3;
    const h = params.height ?? 1.8;
    const n = Math.max(2, Math.round(params.shelves ?? 4));
    const t = params.thickness ?? 0.03;

    const left = box(scene, `${name}_l`, t, h, d, -(w / 2 - t / 2), h / 2, 0);
    const right = box(scene, `${name}_r`, t, h, d, w / 2 - t / 2, h / 2, 0);
    const back = box(scene, `${name}_bk`, w, h, t, 0, h / 2, -(d / 2 - t / 2));

    const parts = [left, right, back];
    for (let i = 0; i < n; i++) {
      const y = (h - t) * (i / (n - 1)) + t / 2;
      parts.push(box(scene, `${name}_s${i}`, w - 2 * t, t, d, 0, y, 0));
    }

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, parts);
  },
  baseY: (p) => (p.height ?? 1.8) / 2,
};

export const BAR_COUNTER: PrimitiveDef = {
  id: "bar_counter",
  label: "Bar counter",
  category: "furniture",
  icon: "bar",
  defaultColor: DARK_WOOD,
  params: [
    { key: "length", label: "Length", min: 1, max: 6, step: 0.25, default: 2.4 },
    { key: "depth", label: "Depth", min: 0.4, max: 1.2, step: 0.05, default: 0.6 },
    { key: "height", label: "Height", min: 0.9, max: 1.3, step: 0.02, default: 1.1 },
    { key: "topOverhang", label: "Top overhang", min: 0, max: 0.4, step: 0.02, default: 0.1 },
  ],
  build(scene, name, params, color) {
    const l = params.length ?? 2.4;
    const d = params.depth ?? 0.6;
    const h = params.height ?? 1.1;
    const over = params.topOverhang ?? 0.1;
    const tt = 0.06;

    const body = box(scene, `${name}_body`, l, h - tt, d, 0, (h - tt) / 2, 0);
    const top = box(scene, `${name}_top`, l + over * 2, tt, d + over, 0, h - tt / 2, over / 2);
    const kick = box(scene, `${name}_kick`, l, 0.08, 0.04, 0, 0.04, d / 2 + 0.02);

    const mat = makeMaterial(scene, name, color);
    return mergeCompound(scene, name, mat, [body, top, kick]);
  },
  baseY: (p) => (p.height ?? 1.1) / 2,
};

export const FURNITURE_PRIMITIVES = [CHAIR, STOOL, TABLE, DESK, SHELF, BAR_COUNTER];
