import type { FC, SVGProps, ReactElement } from 'react'

// ── Types ───────────────────────────────────────────────────────────────────

interface SymbolProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export interface BodyBounds {
  left: number
  right: number
  top: number
  bottom: number
}

// ── Constants ───────────────────────────────────────────────────────────────

const BUBBLE_R = 5

// ── Shape path generators ───────────────────────────────────────────────────

function andPath(b: BodyBounds): string {
  const r = (b.bottom - b.top) / 2
  // Flat left + semicircular arc right
  return `M${b.left} ${b.top} L${b.right - r} ${b.top} A${r} ${r} 0 0 1 ${b.right - r} ${b.bottom} L${b.left} ${b.bottom} Z`
}

function orPath(b: BodyBounds): string {
  const midY = (b.top + b.bottom) / 2
  const curveIn = b.left + (b.right - b.left) * 0.2
  // Concave left bezier + convex right meeting at point
  return `M${b.left} ${b.top} Q${curveIn} ${midY} ${b.left} ${b.bottom} Q${(b.left + b.right) / 2} ${b.bottom} ${b.right} ${midY} Q${(b.left + b.right) / 2} ${b.top} ${b.left} ${b.top} Z`
}

function xorPath(b: BodyBounds): string {
  return orPath(b)
}

function xorExtraCurve(b: BodyBounds): string {
  const midY = (b.top + b.bottom) / 2
  const offset = 6
  const curveIn = b.left - offset + (b.right - b.left) * 0.2
  return `M${b.left - offset} ${b.top} Q${curveIn} ${midY} ${b.left - offset} ${b.bottom}`
}

function trianglePath(b: BodyBounds): string {
  const midY = (b.top + b.bottom) / 2
  return `M${b.left} ${b.top} L${b.right} ${midY} L${b.left} ${b.bottom} Z`
}

// ── Helper: compute where input lines meet shaped gate body ─────────────────

function shapedInputX(type: string, y: number, b: BodyBounds): number {
  if (type === 'AND' || type === 'NAND') {
    return b.left
  }
  if (type === 'OR' || type === 'NOR' || type === 'XOR' || type === 'XNOR') {
    // Concave left curve: quadratic from top to bottom through curveIn
    const curveIn = b.left + (b.right - b.left) * 0.2
    const t = (y - b.top) / (b.bottom - b.top)
    // Quadratic bezier: P0=left, P1=curveIn, P2=left
    const x = (1 - t) * (1 - t) * b.left + 2 * (1 - t) * t * curveIn + t * t * b.left
    return x
  }
  if (type === 'NOT' || type === 'BUFFER') {
    // Triangle left edge: linear from (left,top) to (left,bottom)
    return b.left
  }
  if (type === 'TRI_BUFFER') {
    // Triangle: inputs come from left side
    return b.left
  }
  return b.left
}

// ── Render: Shaped Gate ─────────────────────────────────────────────────────

export function renderShapedGate(
  type: string,
  body: BodyBounds,
  inputYs: number[],
  outputYs: number[],
  nodeWidth: number,
  selected: boolean
): ReactElement {
  const midY = (body.top + body.bottom) / 2
  const isInverted = ['NOT', 'NAND', 'NOR', 'XNOR'].includes(type)
  const bubbleR = isInverted ? BUBBLE_R : 0

  // Adjust body right to make room for bubble
  const effectiveBody: BodyBounds = isInverted ? { ...body, right: body.right - bubbleR * 2 } : body

  // Base type for shape selection
  const shapeType = (() => {
    switch (type) {
      case 'AND':
      case 'NAND':
        return 'AND'
      case 'OR':
      case 'NOR':
        return 'OR'
      case 'XOR':
      case 'XNOR':
        return 'XOR'
      case 'NOT':
      case 'BUFFER':
      case 'TRI_BUFFER':
        return 'TRI'
      default:
        return 'AND'
    }
  })()

  // Build shape path
  let shapePath: string
  switch (shapeType) {
    case 'AND':
      shapePath = andPath(effectiveBody)
      break
    case 'OR':
      shapePath = orPath(effectiveBody)
      break
    case 'XOR':
      shapePath = xorPath(effectiveBody)
      break
    case 'TRI':
      shapePath = trianglePath(effectiveBody)
      break
    default:
      shapePath = andPath(effectiveBody)
  }

  // Output start X (after bubble if present)
  const outputStartX = isInverted ? body.right : body.right

  // Input stub endpoints: where they meet the body
  const inStubs = inputYs.map((y) => {
    const bodyX = shapedInputX(type, y, effectiveBody)
    return { x1: 0, y1: y, x2: bodyX, y2: y }
  })

  // Output stubs
  const outStubs = outputYs.map((y) => ({
    x1: outputStartX,
    y1: y,
    x2: nodeWidth,
    y2: y
  }))

  const shapeClass = selected ? 'gate-shape gate-shape--selected' : 'gate-shape'

  return (
    <g>
      {/* Input stubs */}
      {inStubs.map((s, i) => (
        <line key={`in-${i}`} className="gate-stub" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
      ))}

      {/* Gate shape */}
      <path className={shapeClass} d={shapePath} />

      {/* XOR/XNOR extra curve */}
      {(type === 'XOR' || type === 'XNOR') && (
        <path className={shapeClass} d={xorExtraCurve(effectiveBody)} fill="none" />
      )}

      {/* Inversion bubble */}
      {isInverted && (
        <circle className={shapeClass} cx={effectiveBody.right + bubbleR} cy={midY} r={bubbleR} />
      )}

      {/* Output stubs */}
      {outStubs.map((s, i) => (
        <line key={`out-${i}`} className="gate-stub" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
      ))}
    </g>
  )
}

// ── Render: Box Gate ────────────────────────────────────────────────────────

export function renderBoxGate(
  body: BodyBounds,
  inputYs: number[],
  outputYs: number[],
  nodeWidth: number,
  inputLabels: string[],
  outputLabels: string[],
  title: string,
  selected: boolean
): ReactElement {
  const boxClass = selected ? 'gate-shape gate-shape--selected' : 'gate-shape'

  // Input stubs
  const inStubs = inputYs.map((y) => ({
    x1: 0,
    y1: y,
    x2: body.left,
    y2: y
  }))

  // Output stubs
  const outStubs = outputYs.map((y) => ({
    x1: body.right,
    y1: y,
    x2: nodeWidth,
    y2: y
  }))

  return (
    <g>
      {/* Input stubs */}
      {inStubs.map((s, i) => (
        <line key={`in-${i}`} className="gate-stub" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
      ))}

      {/* Box body */}
      <rect
        className={boxClass}
        x={body.left}
        y={body.top}
        width={body.right - body.left}
        height={body.bottom - body.top}
        rx={2}
      />

      {/* Title */}
      <text className="gate-title" x={(body.left + body.right) / 2} y={body.top + 14}>
        {title}
      </text>

      {/* Input labels */}
      {inputYs.map((y, i) => {
        const label = inputLabels[i] ?? ''
        const isClk = label === 'CLK'
        return (
          <g key={`il-${i}`}>
            {isClk && (
              <polygon
                className="gate-clock-tri"
                points={`${body.left},${y - 5} ${body.left + 7},${y} ${body.left},${y + 5}`}
              />
            )}
            <text
              className="gate-label"
              x={body.left + (isClk ? 10 : 5)}
              y={y + 3.5}
              textAnchor="start"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* Output labels */}
      {outputYs.map((y, i) => (
        <text
          key={`ol-${i}`}
          className="gate-label"
          x={body.right - 5}
          y={y + 3.5}
          textAnchor="end"
        >
          {outputLabels[i] ?? ''}
        </text>
      ))}

      {/* Output stubs */}
      {outStubs.map((s, i) => (
        <line key={`out-${i}`} className="gate-stub" x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
      ))}
    </g>
  )
}

// ── Palette Icons (small thumbnails for GatePalette) ────────────────────────

const paletteDefaults = {
  viewBox: '0 0 40 30',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

function withPaletteDefaults(props: SymbolProps) {
  const { size, ...rest } = props
  return {
    ...paletteDefaults,
    width: size ?? 40,
    height: size ? (size * 30) / 40 : 30,
    ...rest
  }
}

const ANDIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M8 5 L20 5 A15 15 0 0 1 20 25 L8 25 Z" />
  </svg>
)

const ORIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M8 5 Q14 15 8 25 Q20 25 32 15 Q20 5 8 5 Z" />
  </svg>
)

const NOTIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M8 5 L30 15 L8 25 Z" />
    <circle cx="33" cy="15" r="3" />
  </svg>
)

const XORIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M10 5 Q16 15 10 25 Q22 25 34 15 Q22 5 10 5 Z" />
    <path d="M6 5 Q12 15 6 25" />
  </svg>
)

const NANDIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M6 5 L18 5 A15 15 0 0 1 18 25 L6 25 Z" />
    <circle cx="33" cy="15" r="3" />
  </svg>
)

const NORIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M6 5 Q12 15 6 25 Q18 25 30 15 Q18 5 6 5 Z" />
    <circle cx="33" cy="15" r="3" />
  </svg>
)

const XNORIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M8 5 Q14 15 8 25 Q20 25 28 15 Q20 5 8 5 Z" />
    <path d="M4 5 Q10 15 4 25" />
    <circle cx="31" cy="15" r="3" />
  </svg>
)

const BufferIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M8 5 L32 15 L8 25 Z" />
  </svg>
)

const TriBufferIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M8 5 L32 15 L8 25 Z" />
    <path d="M20 30 L20 20" />
  </svg>
)

const DFlipFlopIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="8" y="3" width="24" height="24" rx="1" />
    <text x="12" y="12" fontSize="6" fill="currentColor" stroke="none">
      D
    </text>
    <polygon points="8,17 12,19.5 8,22" fill="currentColor" stroke="none" />
    <text x="25" y="12" fontSize="6" fill="currentColor" stroke="none">
      Q
    </text>
  </svg>
)

const JKFlipFlopIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="8" y="2" width="24" height="26" rx="1" />
    <text x="12" y="10" fontSize="6" fill="currentColor" stroke="none">
      J
    </text>
    <polygon points="8,13 12,15 8,17" fill="currentColor" stroke="none" />
    <text x="12" y="24" fontSize="6" fill="currentColor" stroke="none">
      K
    </text>
    <text x="25" y="10" fontSize="6" fill="currentColor" stroke="none">
      Q
    </text>
  </svg>
)

const ClockIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <polyline points="5,20 5,10 12,10 12,20 19,20 19,10 26,10 26,20 33,20 33,10" fill="none" />
  </svg>
)

const PulseIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <polyline points="5,20 12,20 12,8 22,8 22,20 35,20" fill="none" />
  </svg>
)

const MuxIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M6 3 L30 8 L30 22 L6 27 Z" />
    <text x="13" y="17" fontSize="6" fill="currentColor" stroke="none">
      MUX
    </text>
  </svg>
)

const DemuxIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M6 8 L30 3 L30 27 L6 22 Z" />
    <text x="10" y="17" fontSize="5" fill="currentColor" stroke="none">
      DMUX
    </text>
  </svg>
)

const DecoderIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="11" y="17" fontSize="6" fill="currentColor" stroke="none">
      DEC
    </text>
  </svg>
)

const EncoderIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="11" y="17" fontSize="6" fill="currentColor" stroke="none">
      ENC
    </text>
  </svg>
)

const AdderIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="15" y="19" fontSize="12" fill="currentColor" stroke="none">
      +
    </text>
  </svg>
)

const ComparatorIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="10" y="17" fontSize="6" fill="currentColor" stroke="none">
      CMP
    </text>
  </svg>
)

const RegisterIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="11" y="15" fontSize="6" fill="currentColor" stroke="none">
      REG
    </text>
    <polygon points="6,21 10,23.5 6,26" fill="currentColor" stroke="none" />
  </svg>
)

const ShiftRegIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="8" y="14" fontSize="5" fill="currentColor" stroke="none">
      SREG
    </text>
    <polygon points="6,21 10,23.5 6,26" fill="currentColor" stroke="none" />
    <path d="M12,21 L24,21" strokeWidth="1" />
    <path d="M21,19 L24,21 L21,23" strokeWidth="1" />
  </svg>
)

const CounterIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="11" y="14" fontSize="6" fill="currentColor" stroke="none">
      CNT
    </text>
    <polygon points="6,21 10,23.5 6,26" fill="currentColor" stroke="none" />
    <path d="M18,24 L18,19" strokeWidth="1" />
    <path d="M16,21 L18,19 L20,21" strokeWidth="1" />
  </svg>
)

const RamIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="10" y="13" fontSize="6" fill="currentColor" stroke="none">
      RAM
    </text>
    <text x="12" y="22" fontSize="5" fill="currentColor" stroke="none">
      R/W
    </text>
  </svg>
)

const RomIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="1" />
    <text x="10" y="17" fontSize="6" fill="currentColor" stroke="none">
      ROM
    </text>
  </svg>
)

const Display1DIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="2" />
    <text
      x="20"
      y="21"
      fontSize="14"
      fill="currentColor"
      stroke="none"
      textAnchor="middle"
      fontWeight="bold"
    >
      7
    </text>
  </svg>
)

const Display2DIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="4" y="3" width="32" height="24" rx="2" />
    <text
      x="20"
      y="21"
      fontSize="12"
      fill="currentColor"
      stroke="none"
      textAnchor="middle"
      fontWeight="bold"
    >
      88
    </text>
  </svg>
)

const KeypadIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <rect x="6" y="3" width="28" height="24" rx="2" />
    {[0, 1, 2, 3].map((row) =>
      [0, 1, 2, 3].map((col) => (
        <circle
          key={`${row}-${col}`}
          cx={12 + col * 6}
          cy={8 + row * 5}
          r="1.5"
          fill="currentColor"
          stroke="none"
        />
      ))
    )}
  </svg>
)

const LabelOutIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M6 5 L26 5 L34 15 L26 25 L6 25 Z" fill="#064e3b" stroke="#10b981" />
    <text x="14" y="18" fontSize="6" fill="#6ee7b7" stroke="none" textAnchor="middle">
      OUT
    </text>
  </svg>
)

const LabelInIcon: FC<SymbolProps> = (props) => (
  <svg {...withPaletteDefaults(props)}>
    <path d="M14 5 L34 5 L34 25 L14 25 L6 15 Z" fill="#064e3b" stroke="#10b981" />
    <text x="22" y="18" fontSize="6" fill="#6ee7b7" stroke="none" textAnchor="middle">
      IN
    </text>
  </svg>
)

export const GATE_PALETTE_ICONS: Record<string, FC<SymbolProps>> = {
  AND: ANDIcon,
  OR: ORIcon,
  NOT: NOTIcon,
  XOR: XORIcon,
  NAND: NANDIcon,
  NOR: NORIcon,
  XNOR: XNORIcon,
  BUFFER: BufferIcon,
  TRI_BUFFER: TriBufferIcon,
  D_FLIPFLOP: DFlipFlopIcon,
  JK_FLIPFLOP: JKFlipFlopIcon,
  CLOCK: ClockIcon,
  PULSE: PulseIcon,
  MUX_2TO1: MuxIcon,
  MUX_4TO1: MuxIcon,
  MUX_8TO1: MuxIcon,
  DEMUX_1TO2: DemuxIcon,
  DEMUX_1TO4: DemuxIcon,
  DECODER_2TO4: DecoderIcon,
  DECODER_3TO8: DecoderIcon,
  ENCODER_4TO2: EncoderIcon,
  ENCODER_8TO3: EncoderIcon,
  FULL_ADDER: AdderIcon,
  ADDER_4BIT: AdderIcon,
  COMPARATOR_1BIT: ComparatorIcon,
  COMPARATOR_4BIT: ComparatorIcon,
  REGISTER_4BIT: RegisterIcon,
  REGISTER_8BIT: RegisterIcon,
  SHIFT_REG_4BIT: ShiftRegIcon,
  COUNTER_4BIT: CounterIcon,
  RAM_16X4: RamIcon,
  RAM_16X8: RamIcon,
  ROM_16X4: RomIcon,
  ROM_16X8: RomIcon,
  DISPLAY_1D: Display1DIcon,
  DISPLAY_2D: Display2DIcon,
  KEYPAD: KeypadIcon,
  LABEL_OUT: LabelOutIcon,
  LABEL_IN: LabelInIcon
}
