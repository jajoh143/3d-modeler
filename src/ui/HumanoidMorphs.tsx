import { Divider, Group, Slider, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import type { Mesh } from "@babylonjs/core";
import { getEditor } from "../editor/EditorHandle";
import { SetMorphCommand } from "../editor/commands/SetMorphCommand";
import { MORPH_DEFS } from "../features/humanoid";

export function HumanoidMorphs({ mesh, nodeId }: { mesh: Mesh; nodeId: string }) {
  const mgr = mesh.morphTargetManager;
  const [values, setValues] = useState<Record<string, number>>(() => readCurrent(mesh));

  useEffect(() => {
    setValues(readCurrent(mesh));
  }, [nodeId, mesh]);

  if (!mgr) return null;

  const preview = (key: string, v: number) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    for (let i = 0; i < mgr.numTargets; i++) {
      const t = mgr.getTarget(i);
      if (t.name === key) t.influence = v;
    }
  };

  const commit = (key: string, v: number) => {
    const editor = getEditor();
    if (!editor) return;
    const meta = (mesh.metadata ?? {}) as { morphs?: Record<string, number> };
    const prev = meta.morphs?.[key] ?? 0;
    if (Math.abs(prev - v) < 1e-4) return;
    editor.bus.execute(new SetMorphCommand(nodeId, key, prev, v));
  };

  return (
    <Stack gap="xs">
      <Divider label="Body morphs" labelPosition="center" size="xs" />
      {MORPH_DEFS.map((def) => {
        const v = values[def.key] ?? 0;
        return (
          <Stack gap={2} key={def.key}>
            <Group justify="space-between" gap={4}>
              <Text size="xs" c="dimmed">
                {def.label}
              </Text>
              <Text size="xs" c="dimmed">
                {v.toFixed(2)}
              </Text>
            </Group>
            <Slider
              size="xs"
              min={0}
              max={1}
              step={0.01}
              value={v}
              onChange={(nv) => preview(def.key, nv)}
              onChangeEnd={(nv) => commit(def.key, nv)}
              label={null}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}

function readCurrent(mesh: Mesh): Record<string, number> {
  const mgr = mesh.morphTargetManager;
  if (!mgr) return {};
  const out: Record<string, number> = {};
  for (let i = 0; i < mgr.numTargets; i++) {
    const t = mgr.getTarget(i);
    out[t.name] = t.influence;
  }
  return out;
}
