import { Accordion, Button, Divider, Group, Slider, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Vector3, type Mesh } from "@babylonjs/core";
import { getEditor } from "../editor/EditorHandle";
import { SetBoneRotationCommand } from "../editor/commands/SetBoneRotationCommand";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Bones exposed in the pose UI. Full 22-bone skeleton is live for skinning,
 *  but these are the high-value articulation points for manual posing. */
const POSE_BONES: { key: string; label: string }[] = [
  { key: "mixamorig:Spine", label: "Spine (lower)" },
  { key: "mixamorig:Spine2", label: "Spine (upper)" },
  { key: "mixamorig:Neck", label: "Neck" },
  { key: "mixamorig:Head", label: "Head" },
  { key: "mixamorig:LeftArm", label: "Left shoulder" },
  { key: "mixamorig:LeftForeArm", label: "Left elbow" },
  { key: "mixamorig:RightArm", label: "Right shoulder" },
  { key: "mixamorig:RightForeArm", label: "Right elbow" },
  { key: "mixamorig:LeftUpLeg", label: "Left hip" },
  { key: "mixamorig:LeftLeg", label: "Left knee" },
  { key: "mixamorig:RightUpLeg", label: "Right hip" },
  { key: "mixamorig:RightLeg", label: "Right knee" },
];

type Rot = [number, number, number];

export function HumanoidPose({ mesh, nodeId }: { mesh: Mesh; nodeId: string }) {
  const [rotations, setRotations] = useState<Record<string, Rot>>(() => readPose(mesh));

  useEffect(() => {
    setRotations(readPose(mesh));
  }, [nodeId, mesh]);

  if (!mesh.skeleton) return null;

  const previewLive = (key: string, next: Rot) => {
    setRotations((prev) => ({ ...prev, [key]: next }));
    const bone = mesh.skeleton?.bones.find((b) => b.name === key);
    if (bone) bone.setRotation(new Vector3(next[0], next[1], next[2]));
  };

  const commit = (key: string, next: Rot) => {
    const editor = getEditor();
    if (!editor) return;
    const stored = (mesh.metadata?.pose as Record<string, Rot> | undefined) ?? {};
    const prev = stored[key] ?? ([0, 0, 0] as Rot);
    if (prev[0] === next[0] && prev[1] === next[1] && prev[2] === next[2]) return;
    editor.bus.execute(new SetBoneRotationCommand(nodeId, key, prev, next));
  };

  const resetAll = () => {
    const editor = getEditor();
    if (!editor || !mesh.skeleton) return;
    const stored = (mesh.metadata?.pose as Record<string, Rot> | undefined) ?? {};
    for (const [boneName, prev] of Object.entries(stored)) {
      editor.bus.execute(new SetBoneRotationCommand(nodeId, boneName, prev, [0, 0, 0]));
    }
    setRotations({});
  };

  return (
    <Stack gap="xs">
      <Divider label="Pose" labelPosition="center" size="xs" />
      <Group justify="flex-end">
        <Button size="compact-xs" variant="subtle" onClick={resetAll}>
          Reset pose
        </Button>
      </Group>
      <Accordion variant="contained" chevronPosition="left" multiple defaultValue={[]}>
        {POSE_BONES.map((b) => {
          const r = rotations[b.key] ?? ([0, 0, 0] as Rot);
          return (
            <Accordion.Item key={b.key} value={b.key}>
              <Accordion.Control>
                <Text size="xs">{b.label}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap={6}>
                  <AxisSlider
                    axis="X"
                    value={r[0]}
                    onPreview={(v) => previewLive(b.key, [v, r[1], r[2]])}
                    onCommit={(v) => commit(b.key, [v, r[1], r[2]])}
                  />
                  <AxisSlider
                    axis="Y"
                    value={r[1]}
                    onPreview={(v) => previewLive(b.key, [r[0], v, r[2]])}
                    onCommit={(v) => commit(b.key, [r[0], v, r[2]])}
                  />
                  <AxisSlider
                    axis="Z"
                    value={r[2]}
                    onPreview={(v) => previewLive(b.key, [r[0], r[1], v])}
                    onCommit={(v) => commit(b.key, [r[0], r[1], v])}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Stack>
  );
}

function AxisSlider({
  axis,
  value,
  onPreview,
  onCommit,
}: {
  axis: "X" | "Y" | "Z";
  value: number;
  onPreview: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  const deg = value * RAD_TO_DEG;
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap={4}>
        <Text size="xs" c="dimmed">{axis}</Text>
        <Text size="xs" c="dimmed">{deg.toFixed(0)}°</Text>
      </Group>
      <Slider
        size="xs"
        min={-180}
        max={180}
        step={1}
        value={deg}
        onChange={(nv) => onPreview(nv * DEG_TO_RAD)}
        onChangeEnd={(nv) => onCommit(nv * DEG_TO_RAD)}
        label={null}
      />
    </Stack>
  );
}

function readPose(mesh: Mesh): Record<string, Rot> {
  if (!mesh.skeleton) return {};
  const out: Record<string, Rot> = {};
  for (const bone of mesh.skeleton.bones) {
    const r = bone.getRotation();
    if (r.x !== 0 || r.y !== 0 || r.z !== 0) out[bone.name] = [r.x, r.y, r.z];
  }
  return out;
}
