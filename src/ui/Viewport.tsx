import { useEffect, useRef } from "react";
import { EditorScene } from "../editor/engine/Scene";

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<EditorScene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const editor = new EditorScene(canvasRef.current);
    editor.start();
    sceneRef.current = editor;
    return () => {
      editor.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
