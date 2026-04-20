import { Viewport } from "./ui/Viewport";
import { TopBar } from "./ui/TopBar";
import { LeftSidebar } from "./ui/LeftSidebar";
import { InspectorPanel } from "./ui/InspectorPanel";
import { KeyboardShortcuts } from "./ui/KeyboardShortcuts";

export default function App() {
  return (
    <div style={rootStyle}>
      <TopBar />
      <div style={bodyStyle}>
        <aside style={leftPanelStyle}>
          <LeftSidebar />
        </aside>
        <main style={viewportStyle}>
          <Viewport />
        </main>
        <aside style={rightPanelStyle}>
          <InspectorPanel />
        </aside>
      </div>
      <KeyboardShortcuts />
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
};

const bodyStyle: React.CSSProperties = {
  flex: 1,
  display: "grid",
  gridTemplateColumns: "240px 1fr 260px",
  minHeight: 0,
};

const panelShared: React.CSSProperties = {
  background: "#1a1b1e",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

const leftPanelStyle: React.CSSProperties = {
  ...panelShared,
  borderRight: "1px solid #2c2e33",
};

const rightPanelStyle: React.CSSProperties = {
  ...panelShared,
  borderLeft: "1px solid #2c2e33",
};

const viewportStyle: React.CSSProperties = {
  position: "relative",
  minWidth: 0,
};
