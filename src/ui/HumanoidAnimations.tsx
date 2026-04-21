import {
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  FileButton,
  Group,
  NumberInput,
  Select,
  Slider,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Pause, Play, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AnimationGroup, Mesh } from "@babylonjs/core";
import {
  ANIMATION_DEFS,
  applyBoneRotations,
  buildRecordedGroup,
  importAnimationsFromFile,
  readBoneRotations,
  type RecordedFrame,
} from "../features/humanoid";

interface Recording {
  name: string;
  loop: boolean;
  frames: RecordedFrame[];
}

interface AnimState {
  builtin: Map<string, AnimationGroup>; // keyed by def.id
  imported: AnimationGroup[];
  active: AnimationGroup | null;
  recording: Recording | null;
}

const stateByMesh = new WeakMap<Mesh, AnimState>();

function ensureState(mesh: Mesh): AnimState {
  let state = stateByMesh.get(mesh);
  if (!state) {
    state = { builtin: new Map(), imported: [], active: null, recording: null };
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

  const startRecording = () => {
     const state = ensureState(mesh);
     state.active?.stop();
     state.active = null;
     setActiveId(null);
     setPlaying(false);
     state.recording = { name: "", loop: true, frames: [] };
     forceRender((n) => n + 1);
  };

  const discardRecording = () => {
    const state = ensureState(mesh);
    state.recording = null;
    forceRender((n) => n + 1);
  };

  const captureFrame = (frame: number) => {
    if (!Number.isFinite(frame) || frame < 0) return;
    const state = ensureState(mesh);
    const rec = state.recording;
    if (!rec) return;
    const pose = readBoneRotations(mesh);
    const without = rec.frames.filter((f) => f.frame !== frame);
    without.push({ frame: Math.round(frame), pose });
    rec.frames = without.sort((a, b) => a.frame - b.frame);
    forceRender((n) => n + 1);
  };

  const deleteFrame = (frame: number) => {
    const state = ensureState(mesh);
    const rec = state.recording;
    if (!rec) return;
    rec.frames = rec.frames.filter((f) => f.frame !== frame);
    forceRender((n) => n + 1);
  };

  const updateRecording = (patch: Partial<Recording>) => {
    const state = ensureState(mesh);
    if (!state.recording) return;
    state.recording = { ...state.recording, ...patch };
    forceRender((n) => n + 1);
  };

  const saveRecording = () => {
    if (!mesh.skeleton) return;
    const state = ensureState(mesh);
    const rec = state.recording;
    if (!rec || rec.frames.length < 2) return;
    const base = rec.name.trim() || "Recorded";
    const id = uniqueName(base, state.imported.map((g) => g.name));
    const group = buildRecordedGroup(mesh.getScene(), mesh.skeleton, id, rec.frames, rec.loop);
    if (!group) return;
    state.imported.push(group);
    state.recording = null;
    forceRender((n) => n + 1);
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
      <RecorderSection
        mesh={mesh}
        onStart={startRecording}
        onCapture={captureFrame}
        onDelete={deleteFrame}
        onDiscard={discardRecording}
        onSave={saveRecording}
        onUpdate={updateRecording}
      />
    </Stack>
  );
}

function RecorderSection({
  mesh,
  onStart,
  onCapture,
  onDelete,
  onDiscard,
  onSave,
  onUpdate,
}: {
  mesh: Mesh;
  onStart: () => void;
  onCapture: (frame: number) => void;
  onDelete: (frame: number) => void;
  onDiscard: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<Recording>) => void;
}) {
  const rec = stateByMesh.get(mesh)?.recording ?? null;
  const [nextFrame, setNextFrame] = useState(0);

  if (!rec) {
    return (
      <>
        <Divider label="Record pose" labelPosition="center" size="xs" />
        <Button size="xs" variant="light" onClick={onStart}>
          Start recording
        </Button>
        <Text size="xs" c="dimmed">
          Capture the current pose at a series of frames to author your own animation.
        </Text>
      </>
    );
  }

  const canSave = rec.frames.length >= 2;

  return (
    <>
      <Divider label="Recording" labelPosition="center" size="xs" />
      <TextInput
        size="xs"
        placeholder="Name (e.g. Bow)"
        value={rec.name}
        onChange={(e) => onUpdate({ name: e.currentTarget.value })}
      />
      <Group gap={6} wrap="nowrap" align="flex-end">
        <NumberInput
          size="xs"
          style={{ flex: 1 }}
          label="Frame"
          value={nextFrame}
          min={0}
          step={15}
          onChange={(v) => setNextFrame(typeof v === "number" ? v : Number(v) || 0)}
        />
        <Button size="xs" variant="light" onClick={() => onCapture(nextFrame)}>
          Capture
        </Button>
      </Group>
      <Checkbox
        size="xs"
        label="Loop"
        checked={rec.loop}
        onChange={(e) => onUpdate({ loop: e.currentTarget.checked })}
      />
      {rec.frames.length > 0 && (
        <Stack gap={2}>
          <Text size="xs" c="dimmed">Keyframes (60 fps)</Text>
          {rec.frames.map((f) => (
            <Group key={f.frame} gap={6} justify="space-between" wrap="nowrap">
              <Text size="xs">
                {f.frame} ({(f.frame / 60).toFixed(2)}s) — {Object.keys(f.pose).length} bones
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={() => onDelete(f.frame)}
                aria-label="Delete frame"
              >
                <Trash2 size={12} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      )}
      <Group gap={6} wrap="nowrap">
        <Button size="xs" variant="filled" onClick={onSave} disabled={!canSave} style={{ flex: 1 }}>
          Save
        </Button>
        <Button size="xs" variant="subtle" color="gray" onClick={onDiscard}>
          Discard
        </Button>
      </Group>
      {!canSave && (
        <Text size="xs" c="dimmed">
          Capture at least two frames to save.
        </Text>
      )}
    </>
  );
}

function restorePose(mesh: Mesh): void {
  const pose = (mesh.metadata?.pose as Record<string, [number, number, number]> | undefined) ?? {};
  applyBoneRotations(mesh, pose);
}

function uniqueName(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}
