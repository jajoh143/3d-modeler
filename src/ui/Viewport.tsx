import { useEffect, useRef } from "react";
import { EditorScene } from "../editor/engine/Scene";
import { setEditor } from "../editor/EditorHandle";
import { useEditorStore } from "../state/editorStore";

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const editor = new EditorScene(canvasRef.current, useEditorStore);
    editor.start();
    setEditor(editor);

    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.selectedIds !== prev.selectedIds) editor.syncSelection(state.selectedIds);
      if (state.activeTool !== prev.activeTool) editor.setTool(state.activeTool);
      if (state.cameraMode !== prev.cameraMode) editor.setCameraMode(state.cameraMode);
    });

    // Apply initial tool state
    editor.setTool(useEditorStore.getState().activeTool);

    return () => {
      unsubscribe();
      setEditor(null);
      editor.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
