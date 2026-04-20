import { ActionIcon, Divider, FileButton, Group, Slider, Stack, Text } from "@mantine/core";
import { Image as ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PBRMetallicRoughnessMaterial, type Mesh } from "@babylonjs/core";
import { getEditor } from "../editor/EditorHandle";
import { SetMaterialCommand } from "../editor/commands/SetMaterialCommand";
import {
  defaultMaterialState,
  readMaterial,
  type MaterialState,
  type TextureSlot,
} from "../editor/engine/factory";

const SLOTS: { key: TextureSlot; label: string }[] = [
  { key: "base", label: "Albedo" },
  { key: "metallicRoughness", label: "Metallic / Roughness" },
  { key: "normal", label: "Normal" },
  { key: "occlusion", label: "Ambient Occlusion" },
];

export function MaterialEditor({ mesh, nodeId }: { mesh: Mesh; nodeId: string }) {
  const [state, setState] = useState<MaterialState>(() => readMaterial(mesh));

  useEffect(() => {
    setState(readMaterial(mesh));
  }, [nodeId, mesh]);

  /** Live preview a scalar without touching metadata, so commit's "old state" stays intact. */
  const previewLive = (patch: { metallic?: number; roughness?: number }) => {
    setState((prev) => ({ ...prev, ...patch }));
    const mat = mesh.material;
    if (mat instanceof PBRMetallicRoughnessMaterial) {
      if (patch.metallic !== undefined) mat.metallic = patch.metallic;
      if (patch.roughness !== undefined) mat.roughness = patch.roughness;
    }
  };

  const commit = (next: MaterialState) => {
    const editor = getEditor();
    if (!editor) return;
    const prev = (mesh.metadata?.material as MaterialState | undefined) ?? defaultMaterialState();
    if (sameState(prev, next)) return;
    editor.bus.execute(new SetMaterialCommand(nodeId, prev, next));
  };

  const pickTexture = async (slot: TextureSlot, file: File | null) => {
    if (!file) return;
    const url = await readAsDataUrl(file);
    const next = { ...state, textures: { ...state.textures, [slot]: url } };
    setState(next);
    commit(next);
  };

  const clearTexture = (slot: TextureSlot) => {
    if (!state.textures[slot]) return;
    const nextTex = { ...state.textures };
    delete nextTex[slot];
    const next = { ...state, textures: nextTex };
    setState(next);
    commit(next);
  };

  return (
    <Stack gap="xs">
      <Divider label="Material (PBR)" labelPosition="center" size="xs" />
      <ScalarRow
        label="Metallic"
        value={state.metallic}
        onChange={(v) => previewLive({ metallic: v })}
        onCommit={(v) => commit({ ...state, metallic: v })}
      />
      <ScalarRow
        label="Roughness"
        value={state.roughness}
        onChange={(v) => previewLive({ roughness: v })}
        onCommit={(v) => commit({ ...state, roughness: v })}
      />
      <Stack gap={4}>
        {SLOTS.map((s) => (
          <TextureRow
            key={s.key}
            label={s.label}
            value={state.textures[s.key]}
            onPick={(file) => pickTexture(s.key, file)}
            onClear={() => clearTexture(s.key)}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function ScalarRow({
  label,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  return (
    <Stack gap={2}>
      <Group justify="space-between" gap={4}>
        <Text size="xs" c="dimmed">{label}</Text>
        <Text size="xs" c="dimmed">{value.toFixed(2)}</Text>
      </Group>
      <Slider
        size="xs"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={onChange}
        onChangeEnd={onCommit}
        label={null}
      />
    </Stack>
  );
}

function TextureRow({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value: string | undefined;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <Group gap={6} wrap="nowrap" align="center">
      <Thumbnail src={value} />
      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
        <Text size="xs" c="dimmed" truncate>{label}</Text>
        <Group gap={4} wrap="nowrap">
          <FileButton onChange={onPick} accept="image/png,image/jpeg,image/webp">
            {(props) => (
              <Text {...props} size="xs" c="blue.4" style={{ cursor: "pointer" }}>
                {value ? "Replace" : "Choose…"}
              </Text>
            )}
          </FileButton>
          {value && (
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={onClear} aria-label="Clear texture">
              <X size={12} />
            </ActionIcon>
          )}
        </Group>
      </Stack>
    </Group>
  );
}

function Thumbnail({ src }: { src: string | undefined }) {
  const style: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 4,
    background: "#1f2024",
    border: "1px solid #2c2e33",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  };
  if (!src) {
    return (
      <div style={style}>
        <ImageIcon size={14} color="#5c5f66" />
      </div>
    );
  }
  return (
    <div style={style}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

function sameState(a: MaterialState, b: MaterialState): boolean {
  if (a.metallic !== b.metallic) return false;
  if (a.roughness !== b.roughness) return false;
  const keys: TextureSlot[] = ["base", "metallicRoughness", "normal", "occlusion"];
  for (const k of keys) {
    if ((a.textures[k] ?? null) !== (b.textures[k] ?? null)) return false;
  }
  return true;
}
