import {
  Armchair,
  Box,
  Circle,
  Columns3,
  Cylinder,
  DoorOpen,
  FlaskConical,
  LayoutPanelLeft,
  Library,
  Martini,
  Shapes,
  Square,
  Table as TableIcon,
  Triangle,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { IconName } from "../editor/primitives/types";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const MAP: Record<IconName, IconComp> = {
  box: Box,
  circle: Circle,
  cylinder: Cylinder,
  square: Square,
  panel: LayoutPanelLeft,
  columns: Columns3,
  "door-open": DoorOpen,
  pillar: Columns3,
  triangle: Triangle,
  armchair: Armchair,
  table: TableIcon,
  bookshelf: Library,
  stool: FlaskConical,
  bottle: Martini,
  bar: Shapes,
};

export function PrimitiveIcon({ name, size = 14 }: { name: IconName; size?: number }) {
  const Icon = MAP[name] ?? Shapes;
  return <Icon size={size} />;
}
