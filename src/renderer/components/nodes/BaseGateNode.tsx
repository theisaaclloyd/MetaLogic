import { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GateNodeData } from '../../stores/circuitStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { StateType } from '../../simulation/types/state'
import { getWireStateColor } from '../../simulation/core/WireResolver'
import { renderShapedGate, renderBoxGate, type BodyBounds } from '../icons/GateSymbols'
import { HANDLE_LABELS } from './handleLabels'

// ── Constants ───────────────────────────────────────────────────────────────

const STUB_MARGIN = 20
const PORT_SPACING = 22
const PORT_PADDING = 12

const SHAPED_WIDTH = 110
const SHAPED_MIN_HEIGHT = 60
const BOX_MIN_HEIGHT = 70
const SPECIAL_SIZE = 60

// ── Category classification ─────────────────────────────────────────────────

const SHAPED_TYPES = new Set([
  'AND',
  'OR',
  'NOT',
  'XOR',
  'NAND',
  'NOR',
  'XNOR',
  'BUFFER',
  'TRI_BUFFER'
])

const SPECIAL_TYPES = new Set([
  'TOGGLE',
  'LED',
  'CLOCK',
  'PULSE',
  'DISPLAY_1D',
  'DISPLAY_2D',
  'KEYPAD'
])

type NodeCategory = 'shaped' | 'box' | 'special'

function getNodeCategory(type: string): NodeCategory {
  if (SHAPED_TYPES.has(type)) return 'shaped'
  if (SPECIAL_TYPES.has(type)) return 'special'
  return 'box'
}

// ── Box width by type ───────────────────────────────────────────────────────

const BOX_WIDTH_MAP: Record<string, number> = {
  D_FLIPFLOP: 120,
  JK_FLIPFLOP: 120,
  FULL_ADDER: 120,
  MUX_2TO1: 130,
  MUX_4TO1: 130,
  MUX_8TO1: 130,
  DEMUX_1TO2: 130,
  DEMUX_1TO4: 130,
  DECODER_2TO4: 130,
  DECODER_3TO8: 130,
  ENCODER_4TO2: 130,
  ENCODER_8TO3: 130,
  ROM_16X4: 130,
  ROM_16X8: 160,
  ADDER_4BIT: 140,
  COMPARATOR_1BIT: 140,
  COMPARATOR_4BIT: 140,
  REGISTER_4BIT: 140,
  SHIFT_REG_4BIT: 140,
  COUNTER_4BIT: 140,
  RAM_16X4: 140,
  REGISTER_8BIT: 160,
  RAM_16X8: 160
}

function getBoxWidth(type: string): number {
  return BOX_WIDTH_MAP[type] ?? 130
}

// ── Box title labels ────────────────────────────────────────────────────────

const BOX_TITLES: Record<string, string> = {
  D_FLIPFLOP: 'D-FF',
  JK_FLIPFLOP: 'JK-FF',
  MUX_2TO1: 'MUX 2:1',
  MUX_4TO1: 'MUX 4:1',
  MUX_8TO1: 'MUX 8:1',
  DEMUX_1TO2: 'DEMUX 1:2',
  DEMUX_1TO4: 'DEMUX 1:4',
  DECODER_2TO4: 'DEC 2:4',
  DECODER_3TO8: 'DEC 3:8',
  ENCODER_4TO2: 'ENC 4:2',
  ENCODER_8TO3: 'ENC 8:3',
  FULL_ADDER: 'FA',
  ADDER_4BIT: 'ADD4',
  COMPARATOR_1BIT: 'CMP1',
  COMPARATOR_4BIT: 'CMP4',
  REGISTER_4BIT: 'REG4',
  REGISTER_8BIT: 'REG8',
  SHIFT_REG_4BIT: 'SREG4',
  COUNTER_4BIT: 'CNT4',
  RAM_16X4: 'RAM 16x4',
  RAM_16X8: 'RAM 16x8',
  ROM_16X4: 'ROM 16x4',
  ROM_16X8: 'ROM 16x8'
}

// ── Dimension computation ───────────────────────────────────────────────────

function computeNodeDimensions(
  category: NodeCategory,
  type: string,
  inputCount: number,
  outputCount: number
): { width: number; height: number } {
  if (category === 'special') {
    return { width: SPECIAL_SIZE, height: SPECIAL_SIZE }
  }

  const maxPorts = Math.max(inputCount, outputCount)

  if (category === 'shaped') {
    const height = Math.max(SHAPED_MIN_HEIGHT, maxPorts * PORT_SPACING + PORT_PADDING * 2)
    return { width: SHAPED_WIDTH, height }
  }

  // box
  const width = getBoxWidth(type)
  const height = Math.max(BOX_MIN_HEIGHT, maxPorts * PORT_SPACING + PORT_PADDING * 2)
  return { width, height }
}

// ── Handle Y positions ──────────────────────────────────────────────────────

function computeHandleYs(count: number, height: number): number[] {
  const ys: number[] = []
  for (let i = 0; i < count; i++) {
    ys.push(((i + 1) / (count + 1)) * height)
  }
  return ys
}

// ── Body bounds ─────────────────────────────────────────────────────────────

function computeBodyBounds(category: NodeCategory, width: number, height: number): BodyBounds {
  if (category === 'shaped') {
    return {
      left: STUB_MARGIN,
      right: width - STUB_MARGIN,
      top: 4,
      bottom: height - 4
    }
  }
  // box
  return {
    left: STUB_MARGIN,
    right: width - STUB_MARGIN,
    top: 4,
    bottom: height - 4
  }
}

// ── Special node renderer ───────────────────────────────────────────────────

interface GateNodeProps extends NodeProps {
  data: GateNodeData
}

function SpecialNode({
  data,
  selected,
  id: _id,
  handleClick,
  handleKeypadClick
}: {
  data: GateNodeData
  selected: boolean
  id: string
  handleClick: (() => void) | undefined
  handleKeypadClick: ((value: number) => void) | undefined
}) {
  const isInteractive = data.type === 'TOGGLE' || data.type === 'PULSE'
  const isDisplay = data.type === 'DISPLAY_1D' || data.type === 'DISPLAY_2D'
  const isKeypad = data.type === 'KEYPAD'

  const getLedColor = () => {
    const state = data.inputStates[0] ?? StateType.UNKNOWN
    switch (state) {
      case StateType.ONE:
        return 'bg-red-500 shadow-red-500/50 shadow-lg'
      case StateType.ZERO:
        return 'bg-red-900'
      case StateType.CONFLICT:
        return 'bg-amber-500 animate-pulse'
      default:
        return 'bg-gray-600'
    }
  }

  const getToggleState = () => {
    const state = data.outputStates[0] ?? StateType.ZERO
    return state === StateType.ONE
  }

  const labels = HANDLE_LABELS[data.type]

  const inputHandles = []
  for (let i = 0; i < data.inputCount; i++) {
    const topOffset = ((i + 1) / (data.inputCount + 1)) * 100
    const state = data.inputStates[i] ?? StateType.UNKNOWN
    const tooltip = labels?.inputs[i]
    inputHandles.push(
      <Handle
        key={`input-${i}`}
        type="target"
        position={Position.Left}
        id={`input-${i}`}
        className="handle-tooltip-left"
        data-tooltip={tooltip}
        style={{
          top: `${topOffset}%`,
          background: getWireStateColor(state),
          width: 10,
          height: 10,
          border: '2px solid #111827'
        }}
      />
    )
  }

  const outputHandles = []
  for (let i = 0; i < data.outputCount; i++) {
    const topOffset = ((i + 1) / (data.outputCount + 1)) * 100
    const state = data.outputStates[i] ?? StateType.UNKNOWN
    const tooltip = labels?.outputs[i]
    outputHandles.push(
      <Handle
        key={`output-${i}`}
        type="source"
        position={Position.Right}
        id={`output-${i}`}
        className="handle-tooltip-right"
        data-tooltip={tooltip}
        style={{
          top: `${topOffset}%`,
          background: getWireStateColor(state),
          width: 10,
          height: 10,
          border: '2px solid #111827'
        }}
      />
    )
  }

  // Display: compute decimal value from input bits
  const getDisplayValue = () => {
    const bitCount = data.type === 'DISPLAY_1D' ? 4 : 8
    return computeDecimalFromStates(data.inputStates, bitCount)
  }

  // Keypad: compute current value from output bits
  const getKeypadValue = () => {
    let value = 0
    for (let i = 0; i < 4; i++) {
      if (data.outputStates[i] === StateType.ONE) value |= 1 << i
    }
    return value
  }

  if (isDisplay) {
    const displayVal = getDisplayValue()
    const bitCount = data.type === 'DISPLAY_1D' ? 4 : 8
    const maxVal = data.type === 'DISPLAY_1D' ? 15 : 255
    const displayWidth = data.type === 'DISPLAY_1D' ? 80 : 100

    return (
      <div
        className={`
          relative rounded-lg border-2 transition-all duration-150
          ${selected ? 'border-blue-500 shadow-blue-500/30 shadow-lg' : 'border-gray-600'}
          bg-gray-800
        `}
        style={{ width: displayWidth, height: displayWidth }}
      >
        {inputHandles}

        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-[9px] font-medium text-gray-400 select-none">
            {data.label} ({bitCount}-bit)
          </span>
          <span
            className="text-2xl font-bold text-gray-100 select-none font-mono"
            title={`0-${maxVal}`}
          >
            {displayVal ?? '\u2014'}
          </span>
        </div>

        {outputHandles}
      </div>
    )
  }

  if (isKeypad) {
    const currentValue = getKeypadValue()

    return (
      <div
        className={`
          relative rounded-lg border-2 transition-all duration-150
          ${selected ? 'border-blue-500 shadow-blue-500/30 shadow-lg' : 'border-gray-600'}
          bg-gray-800
        `}
        style={{ width: 130, height: 140 }}
      >
        {inputHandles}

        <div className="flex flex-col items-center pt-1 h-full">
          <span className="text-[9px] font-medium text-gray-400 select-none mb-1">
            {data.label}
          </span>
          <div className="grid grid-cols-4 gap-1 px-2 nopan nodrag">
            {Array.from({ length: 16 }, (_, i) => (
              <button
                key={i}
                className="nopan nodrag"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  userSelect: 'none',
                  transition: 'background-color 150ms',
                  background: i === currentValue ? '#22c55e' : '#374151',
                  color: i === currentValue ? '#fff' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleKeypadClick?.(i)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {outputHandles}
      </div>
    )
  }

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-150
        ${selected ? 'border-blue-500 shadow-blue-500/30 shadow-lg' : 'border-gray-600'}
        ${isInteractive ? 'cursor-pointer hover:border-blue-400' : ''}
        bg-gray-800
      `}
      style={{ minWidth: 60, minHeight: 50 }}
      onClick={isInteractive ? handleClick : undefined}
    >
      {inputHandles}

      <div className="px-3 py-2 flex flex-col items-center justify-center min-h-[50px]">
        <span className="text-xs font-bold text-gray-200 select-none">{data.label}</span>

        {data.type === 'LED' && <div className={`w-4 h-4 rounded-full mt-1 ${getLedColor()}`} />}

        {data.type === 'TOGGLE' && (
          <div
            className={`
              w-8 h-4 rounded-full mt-1 relative transition-colors
              ${getToggleState() ? 'bg-green-500' : 'bg-gray-600'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform
                ${getToggleState() ? 'translate-x-4' : 'translate-x-0.5'}
              `}
            />
          </div>
        )}
      </div>

      {outputHandles}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

// ── Helpers ────────────────────────────────────────────────────────────────

function computeDecimalFromStates(states: StateType[], bitCount: number): string | null {
  let value = 0
  for (let i = 0; i < bitCount; i++) {
    const s = states[i]
    if (s === StateType.ONE) {
      value |= 1 << i
    } else if (s !== StateType.ZERO) {
      return null // not all bits are valid
    }
  }
  return String(value)
}

// Types that get a decimal readout on their box
const REGISTER_READOUT_TYPES: Record<string, { outputStart: number; bitCount: number }> = {
  REGISTER_4BIT: { outputStart: 0, bitCount: 4 },
  REGISTER_8BIT: { outputStart: 0, bitCount: 8 },
  SHIFT_REG_4BIT: { outputStart: 0, bitCount: 4 },
  COUNTER_4BIT: { outputStart: 0, bitCount: 4 }
}

export const GateNodeComponent = memo(function GateNode({ id, data, selected }: GateNodeProps) {
  const { toggleInput, triggerPulse, setKeypadValue } = useSimulationStore()

  const handleClick = useCallback(() => {
    if (data.type === 'TOGGLE') {
      toggleInput(id)
    } else if (data.type === 'PULSE') {
      triggerPulse(id)
    }
  }, [id, data.type, toggleInput, triggerPulse])

  const handleKeypadClick = useCallback(
    (value: number) => {
      setKeypadValue(id, value)
    },
    [id, setKeypadValue]
  )

  const category = getNodeCategory(data.type)

  // Special nodes keep their original rendering
  if (category === 'special') {
    return (
      <SpecialNode
        data={data}
        selected={!!selected}
        id={id}
        handleClick={data.type === 'TOGGLE' || data.type === 'PULSE' ? handleClick : undefined}
        handleKeypadClick={data.type === 'KEYPAD' ? handleKeypadClick : undefined}
      />
    )
  }

  const { width, height } = computeNodeDimensions(
    category,
    data.type,
    data.inputCount,
    data.outputCount
  )
  const inputYs = computeHandleYs(data.inputCount, height)
  const outputYs = computeHandleYs(data.outputCount, height)
  const body = computeBodyBounds(category, width, height)
  const labels = HANDLE_LABELS[data.type]

  // Build handle components
  const inputHandles = inputYs.map((_y, i) => {
    const state = data.inputStates[i] ?? StateType.UNKNOWN
    const topPct = ((i + 1) / (data.inputCount + 1)) * 100
    const tooltip = labels?.inputs[i]
    return (
      <Handle
        key={`input-${i}`}
        type="target"
        position={Position.Left}
        id={`input-${i}`}
        className="handle-tooltip-left"
        data-tooltip={tooltip}
        style={{
          top: `${topPct}%`,
          background: getWireStateColor(state),
          width: 10,
          height: 10,
          border: '2px solid #111827'
        }}
      />
    )
  })

  const outputHandles = outputYs.map((_y, i) => {
    const state = data.outputStates[i] ?? StateType.UNKNOWN
    const topPct = ((i + 1) / (data.outputCount + 1)) * 100
    const tooltip = labels?.outputs[i]
    return (
      <Handle
        key={`output-${i}`}
        type="source"
        position={Position.Right}
        id={`output-${i}`}
        className="handle-tooltip-right"
        data-tooltip={tooltip}
        style={{
          top: `${topPct}%`,
          background: getWireStateColor(state),
          width: 10,
          height: 10,
          border: '2px solid #111827'
        }}
      />
    )
  })

  // Render SVG content
  let svgContent
  if (category === 'shaped') {
    svgContent = renderShapedGate(data.type, body, inputYs, outputYs, width, !!selected)
  } else {
    svgContent = renderBoxGate(
      body,
      inputYs,
      outputYs,
      width,
      labels?.inputs ?? [],
      labels?.outputs ?? [],
      BOX_TITLES[data.type] ?? data.label,
      !!selected
    )
  }

  // Compute register readout if applicable
  const readoutConfig = REGISTER_READOUT_TYPES[data.type]
  let readoutText: string | null = null
  if (readoutConfig) {
    const bits = data.outputStates.slice(
      readoutConfig.outputStart,
      readoutConfig.outputStart + readoutConfig.bitCount
    )
    const decimal = computeDecimalFromStates(bits, readoutConfig.bitCount)
    readoutText = decimal !== null ? `= ${decimal}` : '= \u2014'
  }

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {svgContent}
        {readoutText !== null && (
          <text
            x={width / 2}
            y={body.bottom - 4}
            textAnchor="middle"
            className="gate-label"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            {readoutText}
          </text>
        )}
      </svg>
      {inputHandles}
      {outputHandles}
    </div>
  )
})
