# MetaLogic

A modern digital logic simulator built with Electron, React, and TypeScript.

## Features

- **Visual Circuit Editor**: Drag-and-drop gates onto an infinite canvas
- **5-State Logic**: ZERO, ONE, HI_Z (high impedance), CONFLICT, UNKNOWN
- **Real-time Simulation**: Event-driven simulation with visualization
- **Cross-Platform**: Windows, macOS, and Linux support
- **CDL Compatibility**: Open and save .cdl files from original CedarLogic (legacy format)

## Supported Components

### Input Components
- **Toggle Switch** - Manual on/off control
- **Clock** - Periodic signal generator
- **Pulse Button** - Momentary pulse

### Output Components
- **LED** - Visual state indicator

### Basic Gates
- AND, OR, NOT, XOR
- NAND, NOR, XNOR
- Buffer, Tri-State Buffer

### Sequential Logic
- D Flip-Flop
- JK Flip-Flop

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- [Rust](https://rustup.rs/) (optional, for WASM optimization)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/metalogic.git
cd metalogic

# Install dependencies
bun install

# Start development server
bun run dev
```

### Building

```bash
# Build for production
bun run build

# Package for distribution
bun run make
```

### Testing

```bash
bun run test
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New circuit |
| `Ctrl+O` | Open circuit |
| `Ctrl+S` | Save circuit |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` | Delete selected |
| `F5` | Run simulation |
| `F6` | Pause simulation |
| `F7` | Step simulation |
| `F8` | Reset simulation |

## Architecture

```
┌─────────────────────────────────────────┐
│           Main Thread (React UI)        │
│  React Flow Canvas ←→ Zustand Store     │
│              ↓ postMessage              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│              Web Worker                 │
│   TypeScript/WASM Simulation Engine     │
└─────────────────────────────────────────┘
```

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Inspired by the original [CedarLogic](http://cedarlogic.com/) simulator
- [React Flow](https://reactflow.dev/) for the node-based editor
- [Zustand](https://github.com/pmndrs/zustand) for state management
