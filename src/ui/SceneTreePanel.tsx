import { ActionIcon, Group, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { Box, Circle, Cylinder, Eye, EyeOff, Square, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useEditorStore, type PrimitiveKind } from "../state/editorStore";
import { getEditor } from "../editor/EditorHandle";
import { DeleteNodeCommand } from "../editor/commands/DeleteNodeCommand";
import { RenameNodeCommand } from "../editor/commands/RenameNodeCommand";

const ICONS: Record<PrimitiveKind, typeof Box> = {
  box: Box,
  sphere: Circle,
  cylinder: Cylinder,
  ground: Square,
};

export function SceneTreePanel() {
  const nodes = useEditorStore((s) => s.nodes);
  const rootOrder = useEditorStore((s) => s.rootOrder);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelected = useEditorStore((s) => s.setSelected);
  const setVisible = useEditorStore((s) => s.setVisible);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const items = useMemo(
    () => rootOrder.map((id) => nodes[id]).filter((n): n is NonNullable<typeof n> => !!n),
    [rootOrder, nodes],
  );

  const commitRename = (id: string, oldName: string) => {
    const editor = getEditor();
    const next = draftName.trim();
    setEditingId(null);
    if (!editor || !next || next === oldName) return;
    editor.bus.execute(new RenameNodeCommand(id, oldName, next));
  };

  const deleteNode = (id: string) => {
    const editor = getEditor();
    if (!editor) return;
    editor.bus.execute(new DeleteNodeCommand(id));
  };

  const toggleVisible = (id: string, visible: boolean) => {
    const editor = getEditor();
    if (!editor) return;
    const mesh = editor.registry.getMesh(id);
    if (mesh) mesh.setEnabled(!visible);
    setVisible(id, !visible);
  };

  return (
    <Stack gap={0} h="100%">
      <Group px="xs" py={6} justify="space-between" style={headerStyle}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Scene
        </Text>
        <Text size="xs" c="dimmed">
          {items.length} item{items.length === 1 ? "" : "s"}
        </Text>
      </Group>
      <ScrollArea style={{ flex: 1 }} type="auto">
        <Stack gap={0} py={2}>
          {items.length === 0 && (
            <Text size="xs" c="dimmed" px="sm" py="md" ta="center">
              No objects. Use the + menu above to add a primitive.
            </Text>
          )}
          {items.map((n) => {
            const Icon = ICONS[n.kind];
            const selected = selectedIds.includes(n.id);
            const editing = editingId === n.id;
            return (
              <Group
                key={n.id}
                gap={6}
                px="xs"
                py={4}
                wrap="nowrap"
                style={{
                  background: selected ? "rgba(251,191,36,0.12)" : "transparent",
                  borderLeft: `2px solid ${selected ? "#fbbf24" : "transparent"}`,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={(e) => {
                  if (editing) return;
                  if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    const next = selectedIds.includes(n.id)
                      ? selectedIds.filter((x) => x !== n.id)
                      : [...selectedIds, n.id];
                    setSelected(next);
                  } else {
                    setSelected([n.id]);
                  }
                }}
                onDoubleClick={() => {
                  setEditingId(n.id);
                  setDraftName(n.name);
                }}
              >
                <Icon size={14} />
                {editing ? (
                  <TextInput
                    autoFocus
                    size="xs"
                    value={draftName}
                    onChange={(e) => setDraftName(e.currentTarget.value)}
                    onBlur={() => commitRename(n.id, n.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(n.id, n.name);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Text size="xs" style={{ flex: 1 }} truncate>
                    {n.name}
                  </Text>
                )}
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisible(n.id, n.visible);
                  }}
                  title={n.visible ? "Hide" : "Show"}
                >
                  {n.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(n.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </ActionIcon>
              </Group>
            );
          })}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

const headerStyle: React.CSSProperties = {
  background: "#141517",
  borderBottom: "1px solid #2c2e33",
};
