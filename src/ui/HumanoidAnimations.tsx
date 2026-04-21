import { ActionIcon, Divider, FileButton, Group, Select, Slider, Stack, Text } from "@mantine/core";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AnimationGroup, Mesh } from "@babylonjs/core";
import {
  ANIMATION_DEFS,
  applyBoneRotations,
  importAnimationsFromFile,
} from "../features/humanoid";

interface AnimState {
  builtin: Map<string, AnimationGroup>; // keyed by def.id
  imported: AnimationGroup[];
  active: AnimationGroup | null;
}

const stateByMesh = new WeakMap<Mesh, AnimState>();

function ensureState(mesh: Mesh): AnimState {
  let state = stateByMesh.get(mesh);
  if (!state) {
    state = { builtin: new Map(), imported: [], active: null };
    stateByMesh.set(mesh, state);
    mesh.onDisposeObservable.add(() => {
      const s = stateByMesh.get(mesh);
      if (!s) return;
      s.active?.stop();
      for (const g of s.builtin.values()) g.dispose();
      for (const g of s.imported) g.dispose();
      stateByMesh.delete(mesh);
    });
  }
  return state;
}

function buildIfNeeded(mesh: Mesh, defId: string): AnimationGroup | null {
  if (!mesh.skeleton) return null;
  const state = ensureState(mesh);
  const existing = state.builtin.get(defId);
  if (existing) return existing;
  const def = ANIMATION_DEFS.find((d) => d.id === defId);
  if (!def) return null;
  const group = def.build(mesh.getScene(), mesh.skeleton);
  state.builtin.set(defId, group);
  return group;
}

function listAnimations(mesh: Mesh): { value: string; label: string; group: AnimationGroup | null }[] {
  const state = stateByMesh.get(mesh);
  const out: { value: string; label: string; group: AnimationGroup | null }[] = [];
  for (const def of ANIMATION_DEFS) {
    out.push({ value: def.id, label: def.label, group: state?.builtin.get(def.id) ?? null });
  }
  if (state) {
    for (const g of state.imported) {
      out.push({ value: g.name, label: g.name.replace(/^.*?:/, ""), group: g });
    }
  }
  return out;
}

export function HumanoidAnimations({ mesh, nodeId }: { mesh: Mesh; nodeId: string }) {
  const [activeId, setActiveId] = useState<string | null>(() => ensureState(mesh).active?.name ?? null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [importError, setImportError] = useState<string | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const state = ensureState(mesh);
    setActiveId(state.active?.name ?? null);
    setPlaying(state.active?.isPlaying ?? false);
  }, [nodeId, mesh]);

  const options = useMemo(() => listAnimations(mesh), [mesh, activeId, importError]);

  if (!mesh.skeleton) return null;

  const selectValue = activeId;

  const pick = (id: string | null) => {
    const state = ensureState(mesh);
    state.active?.stop();
    state.active = null;
    setPlaying(false);
    if (!id) {
      setActiveId(null);
      restorePose(mesh);
      return;
    }
    let group: AnimationGroup | null = null;
    if (ANIMATION_DEFS.some((d) => d.id === id)) {
      group = buildIfNeeded(mesh, id);
    } else {
      group = state.imported.find((g) => g.name === id) ?? null;
    }
    if (!group) return;
    state.active = group;
    group.speedRatio = speed;
    group.play(true);
    setActiveId(id);
    setPlaying(true);
  };

  const togglePlay = () => {
    const state = ensureState(mesh);
    if (!state.active) return;
    if (state.active.isPlaying) {
      state.active.pause();
      setPlaying(false);
    } else {
      state.active.play(true);
      setPlaying(true);
    }
  };

  const changeSpeed = (v: number) => {
    setSpeed(v);
    const state = ensureState(mesh);
    if (state.active) state.active.speedRatio = v;
  };

  const importGlb = async (file: File | null) => {
    if (!file || !mesh.skeleton) return;
    setImportError(null);
    try {
      const groups = await importAnimationsFromFile(file, mesh.getScene(), mesh.skeleton);
      if (groups.length === 0) {
        setImportError("No compatible bones in this file.");
        return;
      }
      const state = ensureState(mesh);
      state.imported.push(...groups);
      forceRender((n) => n + 1);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <Stack gap="xs">
      <Divider label="Animation" labelPosition="center" size="xs" />
      <Group gap={6} wrap="nowrap" align="flex-end">
        <Select
          size="xs"
          style={{ flex: 1 }}
          placeholder="Choose animation"
          clearable
          data={options.map((o) => ({ value: o.value, label: o.label }))}
          value={selectValue}
          onChange={pick}
        />
        <ActionIcon
          size="lg"
          variant="light"
          onClick={togglePlay}
          disabled={!activeId}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </ActionIcon>
      </Group>
      <Stack gap={2}>
        <Group justify="space-between" gap={4}>
          <Text size="xs" c="dimmed">Speed</Text>
          <Text size="xs" c="dimmed">{speed.toFixed(2)}×</Text>
        </Group>
        <Slider
          size="xs"
          min={0.1}
          max={2}
          step={0.05}
          value={speed}
          onChange={changeSpeed}
          label={null}
        />
      </Stack>
      <Group gap={6} wrap="nowrap" align="center">
        <FileButton onChange={importGlb} accept=".glb,model/gltf-binary">
          {(props) => (
            <Text {...props} size="xs" c="blue.4" style={{ cursor: "pointer" }}>
              Import .glb animation…
            </Text>
          )}
        </FileButton>
      </Group>
      {importError && (
        <Text size="xs" c="red.5">
          {importError}
        </Text>
      )}
      <Text size="xs" c="dimmed">
        Stops return the figure to its posed state.
      </Text>
    </Stack>
  );
}

function restorePose(mesh: Mesh): void {
  const pose = (mesh.metadata?.pose as Record<string, [number, number, number]> | undefined) ?? {};
  applyBoneRotations(mesh, pose);
}
