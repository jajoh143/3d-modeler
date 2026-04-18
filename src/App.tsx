import { Viewport } from "./ui/Viewport";
import { TopBar } from "./ui/TopBar";

export default function App() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
      }}
    >
      <TopBar />
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <Viewport />
      </div>
    </div>
  );
}
