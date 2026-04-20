# 3D Modeler

Open-source, cross-platform (Windows + Mac) 3D modeler focused on game-ready asset creation:

- **Parametric humanoid character creator** (MakeHuman-style morph sliders + auto-rig, Mixamo-compatible skeleton)
- **Modular prop kit-bashing** (buildings, bars, chairs, desks, bottles, etc., from a CC0 starter library)
- **glTF / GLB export** with PBR materials and skeletal animation

Built on **Tauri 2** (Rust shell) + **Babylon.js** (rendering) + **React + TypeScript** (UI).

See [`/root/.claude/plans/i-want-you-to-replicated-moth.md`](../../root/.claude/plans/i-want-you-to-replicated-moth.md) for the full roadmap.

## Status

- **M0 — Scaffold** (complete). Lit cube renders inside a Tauri window.
- **M1 — Editor core** (complete). Scene graph panel, inspector, translate/rotate/scale gizmos, orbit↔fly camera toggle, selection highlight, command-bus undo/redo, project save/load (`.3dmproj` JSON).

### M1 keyboard shortcuts

| Key | Action |
|---|---|
| `Q` / `W` / `E` / `R` | Select / translate / rotate / scale tool (orbit camera only) |
| `F` | Focus selected, or toggle orbit ↔ fly when nothing selected |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `Delete` / `Backspace` | Delete selected |
| `Esc` | Clear selection |
| Fly-mode movement: `W A S D` pan, `E` up, `Q` down, mouse to look |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Rust** ≥ 1.77 (`rustup default stable`)
- **Platform-specific Tauri deps**: see <https://v2.tauri.app/start/prerequisites/>
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools + WebView2
  - **Linux**: `webkit2gtk-4.1`, `libayatana-appindicator3`, `librsvg2`, `build-essential`, etc.

## Run

```bash
pnpm install
pnpm tauri:dev     # launches the desktop app with HMR
```

## Build installers

```bash
pnpm tauri:build   # produces .app/.dmg (Mac) or .msi/.exe (Windows) in src-tauri/target/release/bundle/
```

## Project layout

```
src/                    React + Babylon frontend
  App.tsx  main.tsx
  ui/                   React components (Mantine)
  editor/engine/        Babylon Engine, Scene, cameras
src-tauri/              Rust shell (Tauri 2)
  src/lib.rs            app entrypoint, plugin registration
  tauri.conf.json       window + bundle config
  capabilities/         per-window permission sets
```

## Notes

- **Icons** in `src-tauri/icons/` are 1×1 placeholders — regenerate with `pnpm tauri icon <path-to-source.svg>` before shipping.
- **Cargo.lock** is committed (application, not library).
- Some bundled CC0 asset packs (Kenney, Quaternius) will land in `src-tauri/resources/` in M2. Licenses will be included per pack.

## License

TBD (target: MIT or Apache-2.0 for our code; all deps are MIT/Apache-2.0/BSD/ISC/CC0).
