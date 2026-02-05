import type { FC, SVGProps } from 'react'

interface SymbolProps extends SVGProps<SVGSVGElement> {
  size?: number
}

const defaultProps = {
  viewBox: '0 0 40 30',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

function withDefaults(props: SymbolProps) {
  const { size, ...rest } = props
  return {
    ...defaultProps,
    width: size ?? 40,
    height: size ? (size * 30) / 40 : 30,
    ...rest
  }
}

// AND gate: flat left + semicircle right
const ANDSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M8 5 L20 5 A15 15 0 0 1 20 25 L8 25 Z" />
  </svg>
)

// OR gate: concave left + convex right
const ORSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M8 5 Q14 15 8 25 Q20 25 32 15 Q20 5 8 5 Z" />
  </svg>
)

// NOT gate: triangle + inversion bubble
const NOTSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M8 5 L30 15 L8 25 Z" />
    <circle cx="33" cy="15" r="3" />
  </svg>
)

// XOR gate: OR + extra input curve
const XORSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M10 5 Q16 15 10 25 Q22 25 34 15 Q22 5 10 5 Z" />
    <path d="M6 5 Q12 15 6 25" />
  </svg>
)

// NAND gate: AND + bubble
const NANDSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M6 5 L18 5 A15 15 0 0 1 18 25 L6 25 Z" />
    <circle cx="33" cy="15" r="3" />
  </svg>
)

// NOR gate: OR + bubble
const NORSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M6 5 Q12 15 6 25 Q18 25 30 15 Q18 5 6 5 Z" />
    <circle cx="33" cy="15" r="3" />
  </svg>
)

// XNOR gate: XOR + bubble
const XNORSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M8 5 Q14 15 8 25 Q20 25 28 15 Q20 5 8 5 Z" />
    <path d="M4 5 Q10 15 4 25" />
    <circle cx="31" cy="15" r="3" />
  </svg>
)

// Buffer: triangle
const BufferSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M8 5 L32 15 L8 25 Z" />
  </svg>
)

// Tri-state buffer: triangle + enable line from bottom
const TriBufferSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <path d="M8 5 L32 15 L8 25 Z" />
    <path d="M20 30 L20 20" />
  </svg>
)

// D Flip-Flop: rectangle with pin labels
const DFlipFlopSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <rect x="8" y="3" width="24" height="24" rx="1" />
    <text x="12" y="12" fontSize="6" fill="currentColor" stroke="none">
      D
    </text>
    {/* Clock triangle */}
    <polygon points="8,17 12,19.5 8,22" fill="currentColor" stroke="none" />
    <text x="25" y="12" fontSize="6" fill="currentColor" stroke="none">
      Q
    </text>
    <text x="23" y="24" fontSize="5" fill="currentColor" stroke="none">
      /Q
    </text>
  </svg>
)

// JK Flip-Flop: rectangle with pin labels
const JKFlipFlopSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <rect x="8" y="2" width="24" height="26" rx="1" />
    <text x="12" y="10" fontSize="6" fill="currentColor" stroke="none">
      J
    </text>
    {/* Clock triangle */}
    <polygon points="8,13 12,15 8,17" fill="currentColor" stroke="none" />
    <text x="12" y="24" fontSize="6" fill="currentColor" stroke="none">
      K
    </text>
    <text x="25" y="10" fontSize="6" fill="currentColor" stroke="none">
      Q
    </text>
    <text x="23" y="24" fontSize="5" fill="currentColor" stroke="none">
      /Q
    </text>
  </svg>
)

// Clock: square wave icon
const ClockSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <polyline points="5,20 5,10 12,10 12,20 19,20 19,10 26,10 26,20 33,20 33,10" fill="none" />
  </svg>
)

// Pulse: single pulse waveform
const PulseSymbol: FC<SymbolProps> = (props) => (
  <svg {...withDefaults(props)}>
    <polyline points="5,20 12,20 12,8 22,8 22,20 35,20" fill="none" />
  </svg>
)

export const GATE_SYMBOLS: Record<string, FC<SymbolProps>> = {
  AND: ANDSymbol,
  OR: ORSymbol,
  NOT: NOTSymbol,
  XOR: XORSymbol,
  NAND: NANDSymbol,
  NOR: NORSymbol,
  XNOR: XNORSymbol,
  BUFFER: BufferSymbol,
  TRI_BUFFER: TriBufferSymbol,
  D_FLIPFLOP: DFlipFlopSymbol,
  JK_FLIPFLOP: JKFlipFlopSymbol,
  CLOCK: ClockSymbol,
  PULSE: PulseSymbol
}
