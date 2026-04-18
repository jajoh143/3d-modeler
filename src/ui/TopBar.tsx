import { Group, Text } from "@mantine/core";
import { Boxes } from "lucide-react";

export function TopBar() {
  return (
    <Group
      justify="space-between"
      px="md"
      py={6}
      style={{
        background: "#141517",
        borderBottom: "1px solid #2c2e33",
        userSelect: "none",
      }}
    >
      <Group gap="xs">
        <Boxes size={18} />
        <Text size="sm" fw={600}>
          3D Modeler
        </Text>
      </Group>
      <Text size="xs" c="dimmed">
        M0 scaffold
      </Text>
    </Group>
  );
}
