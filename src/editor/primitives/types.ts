import type { Mesh, Scene } from "@babylonjs/core";

export type CategoryId = "basic" | "architecture" | "furniture" | "props";

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export type IconName =
  | "box"
  | "circle"
  | "cylinder"
  | "square"
  | "panel"
  | "columns"
  | "door-open"
  | "pillar"
  | "triangle"
  | "armchair"
  | "table"
  | "bookshelf"
  | "stool"
  | "bottle"
  | "bar";

export interface PrimitiveDef {
  id: string;
  label: string;
  category: CategoryId;
  icon: IconName;
  params: ParamDef[];
  defaultColor: [number, number, number];
  build(
    scene: Scene,
    name: string,
    params: Record<string, number>,
    color: [number, number, number],
  ): Mesh;
  /** Optional: compute the Y placement so the object sits on the grid. */
  baseY?(params: Record<string, number>): number;
}

export type RGB = [number, number, number];
