import { ActionIcon, Button, Divider, Group, Menu, Text, Tooltip } from "@mantine/core";
import {
  Box,
  Boxes,
  Circle,
  Compass,
  Cylinder,
  FileUp,
  FolderOpen,
  Move,
  MousePointer2,
  Plane,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Scaling,
  Square,
} from "lucide-react";
import { useEditorStore, type PrimitiveKind } from "../state/editorStore";
import { getEditor } from "../editor/EditorHandle";
import type { ToolMode } from "../editor/tools/types";
import { CreatePrimitiveCommand } from "../editor/commands/CreatePrimitiveCommand";
import { makeId } from "../editor/utils/ids";
import { newProject, openProject, saveProject, saveProjectAs } from "../editor/io/projectIo";

const TOOLS: Array<{ tool: ToolMode; icon: typeof Move; label: string; hint: string }> = [
  { tool: "select", icon: MousePointer2, label: "Select", hint: "Q" },
  { tool: "translate", icon: Move, label: "Translate", hint: "W" },
  { tool: "rotate", icon: RotateCw, label: "Rotate", hint: "E" },
  { tool: "scale", icon: Scaling, label: "Scale", hint: "R" },
];

export function TopBar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const cameraMode = useEditorStore((s) => s.cameraMode);
  const setCameraMode = useEditorStore((s) => s.setCameraMode);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const projectName = useEditorStore((s) => s.projectName);
  const dirty = useEditorStore((s) => s.dirty);

  const spawn = (kind: PrimitiveKind) => {
    const editor = getEditor();
    if (!editor) return;
    const id = makeId(kind);
    const name = uniqueName(kind);
    editor.bus.execute(
      new CreatePrimitiveCommand({
        id,
        name,
        kind,
        spec: { kind },
      }),
    );
  };

  const doUndo = () => getEditor()?.bus.undo();
  const doRedo = () => getEditor()?.bus.redo();

  const doSave = async () => {
    const editor = getEditor();
    if (!editor) return;
    try {
      await saveProject(editor);
    } catch (e) {
      console.error(e);
    }
  };
  const doSaveAs = async () => {
    const editor = getEditor();
    if (!editor) return;
    try {
      await saveProjectAs(editor);
    } catch (e) {
      console.error(e);
    }
  };
  const doOpen = async () => {
    const editor = getEditor();
    if (!editor) return;
    try {
      await openProject(editor);
    } catch (e) {
      console.error(e);
    }
  };
  const doNew = () => {
    const editor = getEditor();
    if (!editor) return;
    newProject(editor);
  };

  return (
    <Group justify="space-between" px="md" py={6} style={barStyle}>
      <Group gap="xs">
        <Boxes size={18} />
        <Text size="sm" fw={600}>
          3D Modeler
        </Text>
        <Divider orientation="vertical" />

        <Menu shadow="md" width={160} position="bottom-start">
          <Menu.Target>
            <Button size="xs" variant="default" leftSection={<Plus size={14} />}>
              Add
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<Box size={14} />} onClick={() => spawn("box")}>Box</Menu.Item>
            <Menu.Item leftSection={<Circle size={14} />} onClick={() => spawn("sphere")}>Sphere</Menu.Item>
            <Menu.Item leftSection={<Cylinder size={14} />} onClick={() => spawn("cylinder")}>Cylinder</Menu.Item>
            <Menu.Item leftSection={<Square size={14} />} onClick={() => spawn("ground")}>Ground</Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Divider orientation="vertical" />

        <Group gap={2}>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const active = activeTool === t.tool;
            return (
              <Tooltip key={t.tool} label={`${t.label} (${t.hint})`} withArrow>
                <ActionIcon
                  variant={active ? "filled" : "subtle"}
                  color={active ? "yellow" : "gray"}
                  onClick={() => setActiveTool(t.tool)}
                  size="md"
                >
                  <Icon size={15} />
                </ActionIcon>
              </Tooltip>
            );
          })}
        </Group>

        <Divider orientation="vertical" />

        <Tooltip label={`Camera: ${cameraMode === "orbit" ? "orbit" : "fly"} (F)`} withArrow>
          <Button
            size="xs"
            variant="default"
            leftSection={cameraMode === "orbit" ? <Compass size={14} /> : <Plane size={14} />}
            onClick={() => setCameraMode(cameraMode === "orbit" ? "fly" : "orbit")}
          >
            {cameraMode === "orbit" ? "Orbit" : "Fly"}
          </Button>
        </Tooltip>

        <Divider orientation="vertical" />

        <Tooltip label="Undo (Ctrl/Cmd+Z)" withArrow>
          <ActionIcon variant="subtle" onClick={doUndo} disabled={!canUndo} size="md">
            <RotateCcw size={15} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Redo (Ctrl/Cmd+Shift+Z)" withArrow>
          <ActionIcon variant="subtle" onClick={doRedo} disabled={!canRedo} size="md">
            <RotateCw size={15} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="xs">
        <Text size="xs" c="dimmed">
          {projectName}
          {dirty ? " •" : ""}
        </Text>
        <Divider orientation="vertical" />
        <Menu shadow="md" width={180} position="bottom-end">
          <Menu.Target>
            <Button size="xs" variant="default">
              File
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<FileUp size={14} />} onClick={doNew}>New</Menu.Item>
            <Menu.Item leftSection={<FolderOpen size={14} />} onClick={doOpen}>Open…</Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<Save size={14} />} onClick={doSave}>Save</Menu.Item>
            <Menu.Item onClick={doSaveAs}>Save As…</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}

const barStyle: React.CSSProperties = {
  background: "#141517",
  borderBottom: "1px solid #2c2e33",
  userSelect: "none",
};

function uniqueName(kind: PrimitiveKind): string {
  const existing = new Set(Object.values(useEditorStore.getState().nodes).map((n) => n.name));
  let i = 1;
  while (existing.has(`${capitalize(kind)}.${pad(i)}`)) i += 1;
  return `${capitalize(kind)}.${pad(i)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function pad(n: number): string {
  return n.toString().padStart(3, "0");
}
