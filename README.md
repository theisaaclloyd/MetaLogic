<p align="center">
  <img src="assets/icon.png" alt="MetaLogic" width="128" height="128">
</p>

<h1 align="center">MetaLogic</h1>

<p align="center">
  A modern, cross-platform digital logic simulator inspired by <a href="https://github.com/CedarvilleCS/CedarLogic/">CedarLogic</a>.
</p>

<p align="center">
  <a href="https://github.com/theisaaclloyd/MetaLogic/actions/workflows/release.yml"><img src="https://github.com/theisaaclloyd/MetaLogic/actions/workflows/release.yml/badge.svg" alt="Build & Release"></a>
  <a href="https://github.com/theisaaclloyd/MetaLogic/releases/latest"><img src="https://img.shields.io/github/v/release/theisaaclloyd/MetaLogic?label=latest" alt="Latest Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/theisaaclloyd/MetaLogic" alt="License"></a>
</p>

---

## Features

- **48+ Components** — gates, flip-flops, multiplexers, arithmetic units, memory, and more
- **5-State Logic** — `0`, `1`, `Hi-Z`, `Conflict`, `Unknown` with tri-state bus support
- **Real-Time Simulation** — event-driven engine running in a Web Worker at up to 1000 ticks/sec
- **Drag-and-Drop Editor** — infinite canvas with zoom, pan, grid snapping, and mini-map
- **Undo / Redo** — full 100-entry history
- **Memory Editor** — hex/binary editing for RAM and ROM with live updates during simulation
- **Label Connectors** — named broadcast signals for clean, wire-free connections
- **CedarLogic Compatibility** — import and export `.cdl` files from the original simulator
- **Cross-Platform** — native builds for macOS (ARM), Linux (x64/ARM), and Windows (x64/ARM)

## Download

Grab the latest build for your platform from the [Releases](https://github.com/theisaaclloyd/MetaLogic/releases/latest) page.

| Platform | Architecture | Format |
| - | - | - |
| macOS | ARM64 (Apple Silicon) | `.zip` |
| Linux | x64 | `.deb`, `.rpm` |
| Linux | ARM64 | `.deb`, `.rpm` |
| Windows | x64 | `.exe` |
| Windows | ARM64 | `.exe` |

> [NOTE]
> **macOS:** The app is not code-signed (as a broke college student, I don't have $99 a year to afford an Apple Developer Cert), so macOS will show "damaged and can't be opened." After extracting the zip, run the following in Terminal to remove the quarantine flag:
>
> ```bash
> xattr -cr /path/to/MetaLogic.app
> ```
>
> **Windows:** SmartScreen may warn "Windows protected your PC." Click **More info** then **Run anyway** to proceed with the installation.
>
> If you would rather not download from GitHub and use this workaround, you can also build from source by following the instructions in the Development section below.

## Components

<details>
<summary><strong>Basic Gates</strong></summary>

AND, OR, NOT, XOR, NAND, NOR, XNOR
</details>

<details>
<summary><strong>Buffers</strong></summary>

Buffer, Tri-State Buffer
</details>

<details>
<summary><strong>Inputs</strong></summary>

| Component | Description |
| - | - |
| Toggle Switch | Manual on/off control |
| Clock | Configurable periodic signal generator |
| Pulse Button | Momentary pulse |
| Keypad | 4-bit output (0-15) |

</details>

<details>
<summary><strong>Outputs</strong></summary>

| Component | Description |
| - | - |
| LED | Visual state indicator |
| 1-Digit Display | Decimal display (4-bit input) |
| 2-Digit Display | Decimal display (8-bit input) |

</details>

<details>
<summary><strong>Flip-Flops</strong></summary>

| Component | Description |
| - | - |
| D Flip-Flop | Edge-triggered D-type |
| D Flip-Flop (S/R) | D-type with async set/reset |
| JK Flip-Flop | Edge-triggered JK-type |
| JK Flip-Flop (S/R) | JK-type with async set/reset |

</details>

<details>
<summary><strong>Multiplexers / Demultiplexers</strong></summary>

MUX 2:1, MUX 4:1, MUX 8:1, DEMUX 1:2, DEMUX 1:4
</details>

<details>
<summary><strong>Decoders / Encoders</strong></summary>

Decoder 2:4, Decoder 3:8, Priority Encoder 4:2, Priority Encoder 8:3
</details>

<details>
<summary><strong>Arithmetic</strong></summary>

| Component | Description |
| - | - |
| Full Adder | 1-bit with carry |
| 4-Bit Adder | Ripple-carry |
| 1-Bit Comparator | Cascadable (A>B, A=B, A<B) |
| 4-Bit Comparator | Cascadable |

</details>

<details>
<summary><strong>Memory & Registers</strong></summary>

| Component | Description |
| - | - |
| 4-Bit Register | Parallel load |
| 8-Bit Register | Parallel load |
| 4-Bit Shift Register | Bidirectional (left/right) |
| 4-Bit Counter | Up/down with parallel load |
| RAM 16x4 | 16-address, 4-bit writable memory |
| RAM 16x8 | 16-address, 8-bit writable memory |
| ROM 16x4 | 16-address, 4-bit read-only memory |
| ROM 16x8 | 16-address, 8-bit read-only memory |

</details>

## Keyboard Shortcuts

| Shortcut | Action |
| - | - |
| `Ctrl/Cmd + N` | New circuit |
| `Ctrl/Cmd + O` | Open circuit |
| `Ctrl/Cmd + S` | Save circuit |
| `Ctrl/Cmd + Shift + S` | Save as |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + A` | Select all |
| `Delete / Backspace` | Delete selected |
| `F5` | Run simulation |
| `F6` | Pause simulation |
| `F7` | Step (advance 1 tick) |
| `F8` | Reset simulation |

## File Formats

| Format | Extension | Description |
| - | - | - |
| MetaLogic | `.mlc` | Native JSON-based format (lossless) |
| CedarLogic | `.cdl` | XML import/export for legacy compatibility |
| Memory dump | `.cdm` | Hex address:data pairs for RAM/ROM |

## Development

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) v22+ (required by Electron)

### Setup

```bash
git clone https://github.com/theisaaclloyd/MetaLogic.git
cd MetaLogic
bun install
```

### Commands

| Command | Description |
| - | - |
| `bun run dev` | Start in development mode |
| `bun run build` | Build for production |
| `bun run make` | Create platform distributables |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | TypeScript type checking |
| `bun run test` | Run tests |
| `bun run laundry` | Auto-fix lint + format + typecheck |

### Cross-Platform Builds

The CI pipeline builds all 5 targets automatically on every push to `main`. To build locally for a specific platform:

```bash
bun run make -- --arch=arm64 --platform=darwin   # macOS ARM
bun run make -- --arch=x64 --platform=linux      # Linux x64
bun run make -- --arch=x64 --platform=win32      # Windows x64
```

Output goes to `dist/make/`.

## Architecture

``` txt
┌──────────────────────────────────────────────┐
│              Main Thread                     │
│                                              │
│   React UI ←→ Zustand Stores ←→ React Flow   │
│       │                                      │
│       │ postMessage                          │
│       ▼                                      │
│  ┌────────────────────────────────────────┐  │
│  │           Web Worker                   │  │
│  │   SimulationEngine (event-driven)      │  │
│  │   60 FPS loop · configurable tick rate │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Simulation engine** — event-driven with deterministic gate evaluation, propagation delay support, and a max of 10,000 events per step. Runs entirely off the main thread to keep the UI responsive.

**State management** — Zustand stores for circuit state, simulation control, undo/redo history, memory editing, and toast notifications.

**Rendering** — React Flow provides the node-based canvas with custom gate nodes, smart edge routing, and a mini-map overlay.

## Tech Stack

| Layer | Technology |
| - | - |
| Framework | Electron 40 |
| UI | React 19, Tailwind CSS 4 |
| Canvas | React Flow (@xyflow/react) |
| State | Zustand |
| Build | Electron Vite, Vite 7 |
| Language | TypeScript 5.9 |
| Package Manager | Bun |
| Testing | Vitest |
| CI/CD | GitHub Actions |
| Packaging | Electron Forge |

## Roadmap

Planned features for upcoming releases:

- [ ] **Collapsible properties panel** — toggle the right-side panel to maximize canvas space
- [ ] **Customizable keyboard shortcuts** — user-configurable keybindings for all actions
- [ ] **Editable wires** — click to add bend points and reroute connections manually
- [ ] **Improved CedarLogic import** — better handling of edge cases, unsupported gate types, and wire routing from `.cdl` files

## Contributing

1. Fork the repository
2. Create a feature branch from `dev`
3. Make your changes
4. Run `bun run laundry` to lint, format, and typecheck
5. Open a pull request to `dev`

Releases are cut by merging `dev` into `main` and pushing a version tag (`v*`).

## License

[MIT](LICENSE) &copy; 2026 Isaac Lloyd

## Acknowledgments

- [CedarLogic](http://cedarlogic.com/) — the original simulator that inspired this project
- [React Flow](https://reactflow.dev/) — node-based editor framework
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [Electron Forge](https://www.electronforge.io/) — build and packaging toolchain
