import {
  ColorInput,
  Divider,
  Group,
  NumberInput,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import type { Mesh } from "@babylonjs/core";
import { useEditorStore } from "../state/editorStore";
import { getEditor } from "../editor/EditorHandle";
import { RenameNodeCommand } from "../editor/commands/RenameNodeCommand";
import { TransformNodeCommand } from "../editor/commands/TransformNodeCommand";
import { SetColorCommand } from "../editor/commands/SetColorCommand";
import { UpdateParamsCommand } from "../editor/commands/UpdateParamsCommand";
import { readColor, readKind, readParams } from "../editor/engine/factory";
import { snapshotTransform, type TransformTuple } from "../editor/commands/types";
import { getPrimitive } from "../editor/primitives/registry";
import type { ParamDef } from "../editor/primitives/types";
import { HumanoidMorphs } from "./HumanoidMorphs";
import { HumanoidPose } from "./HumanoidPose";
import { MaterialEditor } from "./MaterialEditor";

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

function hex(color: [number, number, number]): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(color[0])}${to(color[1])}${to(color[2])}`;
}

function parseHex(s: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

export function InspectorPanel() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const nodes = useEditorStore((s) => s.nodes);
  const revision = useEditorStore((s) => s.revision);
  const node = selectedIds.length === 1 ? nodes[selectedIds[0]] : null;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((t) => t + 1);
  }, [selectedIds, revision]);

  const snapshot = useMemo(() => {
    const editor = getEditor();
    if (!node || !editor) return null;
    const m = editor.registry.getMesh(node.id) as Mesh | undefined;
    if (!m) return null;
    const kind = readKind(m) ?? node.kind;
    const def = getPrimitive(kind);
    return {
      mesh: m,
      transform: snapshotTransform(m),
      color: readColor(m),
      params: readParams(m),
      def,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id, tick]);

  if (!node) {
    return (
      <Stack gap={0} h="100%">
        <Header label="Inspector" />
        <Text size="xs" c="dimmed" px="sm" py="md" ta="center">
          Select an object to edit its properties.
        </Text>
      </Stack>
    );
  }

  const { mesh, transform, color, params, def } = snapshot ?? {
    mesh: null,
    transform: null,
    color: null,
    params: null,
    def: undefined,
  };

  const commitName = (next: string) => {
    const editor = getEditor();
    if (!editor) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === node.name) return;
    editor.bus.execute(new RenameNodeCommand(node.id, node.name, trimmed));
  };

  const commitTransform = (pre: TransformTuple, post: TransformTuple) => {
    const editor = getEditor();
    if (!editor || !mesh) return;
    const eq =
      pre[0][0] === post[0][0] && pre[0][1] === post[0][1] && pre[0][2] === post[0][2] &&
      pre[1][0] === post[1][0] && pre[1][1] === post[1][1] && pre[1][2] === post[1][2] &&
      pre[2][0] === post[2][0] && pre[2][1] === post[2][1] && pre[2][2] === post[2][2];
    if (eq) return;
    mesh.position.set(post[0][0], post[0][1], post[0][2]);
    mesh.rotation.set(post[1][0], post[1][1], post[1][2]);
    mesh.scaling.set(post[2][0], post[2][1], post[2][2]);
    editor.bus.pushExecuted(new TransformNodeCommand(node.id, pre, post));
    setTick((t) => t + 1);
  };

  const setAxis = (group: 0 | 1 | 2, axis: 0 | 1 | 2, value: number) => {
    if (!transform) return;
    const post: TransformTuple = [
      [...transform[0]] as [number, number, number],
      [...transform[1]] as [number, number, number],
      [...transform[2]] as [number, number, number],
    ];
    if (group === 1) value = value * DEG_TO_RAD;
    post[group][axis] = value;
    commitTransform(transform, post);
  };

  const commitColor = (next: [number, number, number]) => {
    const editor = getEditor();
    if (!editor || !color) return;
    if (next[0] === color[0] && next[1] === color[1] && next[2] === color[2]) return;
    editor.bus.execute(new SetColorCommand(node.id, color, next));
    setTick((t) => t + 1);
  };

  const commitParam = (key: string, value: number) => {
    const editor = getEditor();
    if (!editor || !params) return;
    if (params[key] === value) return;
    const next = { ...params, [key]: value };
    editor.bus.execute(new UpdateParamsCommand(node.id, next));
  };

  const disabled = !mesh || !transform;

  return (
    <Stack gap={0} h="100%">
      <Header label="Inspector" />
      <ScrollArea style={{ flex: 1 }} type="auto">
        <Stack gap="sm" p="sm">
          <Field label="Name">
            <TextInput
              key={`${node.id}-${node.name}`}
              size="xs"
              defaultValue={node.name}
              onBlur={(e) => commitName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && commitName(e.currentTarget.value)}
            />
          </Field>
          <Field label="Kind">
            <Text size="xs" c="dimmed">
              {def?.label ?? node.kind}
            </Text>
          </Field>

          {def && params && def.params.length > 0 && (
            <>
              <Divider label="Parameters" labelPosition="center" size="xs" />
              <Stack gap={6}>
                {def.params.map((p) => (
                  <ParamRow
                    key={p.key}
                    param={p}
                    value={params[p.key] ?? p.default}
                    disabled={disabled}
                    onCommit={(v) => commitParam(p.key, v)}
                  />
                ))}
              </Stack>
            </>
          )}

          <Divider label="Transform" labelPosition="center" size="xs" />
          <Vec3 label="Position" disabled={disabled} values={transform?.[0]} onCommit={(a, v) => setAxis(0, a, v)} step={0.1} />
          <Vec3
            label="Rotation (°)"
            disabled={disabled}
            values={
              transform ? ([transform[1][0] * RAD_TO_DEG, transform[1][1] * RAD_TO_DEG, transform[1][2] * RAD_TO_DEG] as [number, number, number]) : undefined
            }
            onCommit={(a, v) => setAxis(1, a, v)}
            step={1}
          />
          <Vec3 label="Scale" disabled={disabled} values={transform?.[2]} onCommit={(a, v) => setAxis(2, a, v)} step={0.1} />
          <Field label="Color">
            <ColorInput
              size="xs"
              value={color ? hex(color) : "#ffffff"}
              onChangeEnd={(v) => {
                const parsed = parseHex(v);
                if (parsed) commitColor(parsed);
              }}
              disabled={disabled}
            />
          </Field>
          {mesh && <MaterialEditor mesh={mesh} nodeId={node.id} />}
          {node.kind === "humanoid" && mesh && mesh.morphTargetManager && (
            <HumanoidMorphs mesh={mesh} nodeId={node.id} />
          )}
          {node.kind === "humanoid" && mesh && mesh.skeleton && (
            <HumanoidPose mesh={mesh} nodeId={node.id} />
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

function Header({ label }: { label: string }) {
  return (
    <Group px="xs" py={6} style={{ background: "#141517", borderBottom: "1px solid #2c2e33" }}>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
        {label}
      </Text>
    </Group>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

function Vec3({
  label,
  values,
  disabled,
  onCommit,
  step,
}: {
  label: string;
  values: [number, number, number] | undefined;
  disabled: boolean;
  onCommit: (axis: 0 | 1 | 2, value: number) => void;
  step: number;
}) {
  const v = values ?? ([0, 0, 0] as [number, number, number]);
  return (
    <Field label={label}>
      <Group gap={6} wrap="nowrap">
        {(["X", "Y", "Z"] as const).map((ax, i) => (
          <NumberInput
            key={`${label}-${ax}-${v[i]}`}
            size="xs"
            defaultValue={round(v[i])}
            step={step}
            decimalScale={3}
            disabled={disabled}
            leftSection={<Text size="xs" c="dimmed">{ax}</Text>}
            leftSectionWidth={20}
            onBlur={(e) => {
              const n = Number(e.currentTarget.value);
              if (Number.isFinite(n)) onCommit(i as 0 | 1 | 2, n);
            }}
          />
        ))}
      </Group>
    </Field>
  );
}

function ParamRow({
  param,
  value,
  disabled,
  onCommit,
}: {
  param: ParamDef;
  value: number;
  disabled: boolean;
  onCommit: (v: number) => void;
}) {
  return (
    <Group gap={6} wrap="nowrap" justify="space-between">
      <Text size="xs" c="dimmed" style={{ flex: 1 }}>
        {param.label}
      </Text>
      <NumberInput
        key={`${param.key}-${value}`}
        size="xs"
        defaultValue={round(value)}
        step={param.step}
        min={param.min}
        max={param.max}
        decimalScale={3}
        disabled={disabled}
        style={{ width: 110 }}
        onBlur={(e) => {
          const n = Number(e.currentTarget.value);
          if (Number.isFinite(n)) onCommit(clamp(n, param.min, param.max));
        }}
      />
    </Group>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
