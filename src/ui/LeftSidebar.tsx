import { Tabs } from "@mantine/core";
import { SceneTreePanel } from "./SceneTreePanel";
import { LibraryPanel } from "./LibraryPanel";

export function LeftSidebar() {
  return (
    <Tabs defaultValue="scene" h="100%" keepMounted={false} styles={{ panel: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } }}>
      <Tabs.List>
        <Tabs.Tab value="scene">Scene</Tabs.Tab>
        <Tabs.Tab value="library">Library</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="scene">
        <SceneTreePanel />
      </Tabs.Panel>
      <Tabs.Panel value="library">
        <LibraryPanel />
      </Tabs.Panel>
    </Tabs>
  );
}
