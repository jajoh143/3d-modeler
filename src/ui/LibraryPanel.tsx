import { Group, ScrollArea, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { getEditor } from "../editor/EditorHandle";
import { CreatePrimitiveCommand } from "../editor/commands/CreatePrimitiveCommand";
import { makeId } from "../editor/utils/ids";
import {
  CATEGORY_LABEL,
  primitivesByCategory,
  requirePrimitive,
} from "../editor/primitives/registry";
import type { PrimitiveDef } from "../editor/primitives/types";
import { useEditorStore } from "../state/editorStore";
import { PrimitiveIcon } from "./PrimitiveIcon";

export function LibraryPanel() {
  const grouped = primitivesByCategory();

  const spawn = (def: PrimitiveDef) => {
    const editor = getEditor();
    if (!editor) return;
    requirePrimitive(def.id); // assert known
    const id = makeId(def.id);
    const name = uniqueName(def.label);
    editor.bus.execute(
      new CreatePrimitiveCommand({
        id,
        name,
        kind: def.id,
        spec: { kind: def.id },
      }),
    );
  };

  return (
    <Stack gap={0} h="100%">
      <Group px="xs" py={6} style={headerStyle}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          Library
        </Text>
      </Group>
      <ScrollArea style={{ flex: 1 }} type="auto">
        <Stack gap="sm" p="xs">
          {grouped.map((g) => (
            <Stack gap={4} key={g.category}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {CATEGORY_LABEL[g.category]}
              </Text>
              <SimpleGrid cols={2} spacing={6} verticalSpacing={6}>
                {g.items.map((def) => (
                  <UnstyledButton
                    key={def.id}
                    onClick={() => spawn(def)}
                    title={def.label}
                    style={tileStyle}
                  >
                    <Stack align="center" gap={4} py={8}>
                      <PrimitiveIcon name={def.icon} size={20} />
                      <Text size="xs" ta="center" lineClamp={1} style={{ width: "100%" }}>
                        {def.label}
                      </Text>
                    </Stack>
                  </UnstyledButton>
                ))}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

const headerStyle: React.CSSProperties = {
  background: "#141517",
  borderBottom: "1px solid #2c2e33",
};

const tileStyle: React.CSSProperties = {
  background: "#1f2125",
  border: "1px solid #2c2e33",
  borderRadius: 4,
  color: "#e6e7ea",
  cursor: "pointer",
};

function uniqueName(baseLabel: string): string {
  const existing = new Set(Object.values(useEditorStore.getState().nodes).map((n) => n.name));
  const base = baseLabel.replace(/\s+/g, "");
  let i = 1;
  while (existing.has(`${base}.${pad(i)}`)) i += 1;
  return `${base}.${pad(i)}`;
}

function pad(n: number): string {
  return n.toString().padStart(3, "0");
}
