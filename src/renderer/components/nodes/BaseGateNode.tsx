import { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GateNodeData } from '../../stores/circuitStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { StateType } from '../../simulation/types/state'
import { getWireStateColor } from '../../simulation/core/WireResolver'
import { GATE_SYMBOLS } from '../icons/GateSymbols'
import { HANDLE_LABELS } from './handleLabels'

interface GateNodeProps extends NodeProps {
  data: GateNodeData
}

export const GateNodeComponent = memo(function GateNode({ id, data, selected }: GateNodeProps) {
  const { toggleInput, triggerPulse } = useSimulationStore()

  const handleClick = useCallback(() => {
    if (data.type === 'TOGGLE') {
      toggleInput(id)
    } else if (data.type === 'PULSE') {
      triggerPulse(id)
    }
  }, [id, data.type, toggleInput, triggerPulse])

  const isInput = ['TOGGLE', 'CLOCK', 'PULSE'].includes(data.type)
  const isOutput = data.type === 'LED'
  const isInteractive = data.type === 'TOGGLE' || data.type === 'PULSE'

  const Symbol = GATE_SYMBOLS[data.type]
  const hasSymbol = !!Symbol && data.type !== 'LED' && data.type !== 'TOGGLE'
  const labels = HANDLE_LABELS[data.type]

  // Compute port positions
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
          border: '2px solid #1f2937'
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
          border: '2px solid #1f2937'
        }}
      />
    )
  }

  // Determine node appearance based on type and state
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

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-150
        ${selected ? 'border-blue-500 shadow-blue-500/30 shadow-lg' : 'border-gray-600'}
        ${isInteractive ? 'cursor-pointer hover:border-blue-400' : ''}
        ${isInput ? 'bg-green-900' : isOutput ? 'bg-red-900' : 'bg-gray-800'}
      `}
      style={{
        minWidth: hasSymbol ? 80 : 60,
        minHeight: Math.max(hasSymbol ? 60 : 50, Math.max(data.inputCount, data.outputCount) * 20)
      }}
      onClick={isInteractive ? handleClick : undefined}
    >
      {inputHandles}

      <div className="px-3 py-2 flex flex-col items-center justify-center min-h-[50px]">
        {/* Gate Symbol or Label */}
        {hasSymbol ? (
          <div className="flex flex-col items-center gap-0.5">
            <Symbol className="text-gray-200" size={40} />
            <span className="text-[9px] text-gray-400 select-none">{data.label}</span>
          </div>
        ) : (
          <span className="text-xs font-bold text-gray-200 select-none">{data.label}</span>
        )}

        {/* Special rendering for specific gate types */}
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
})
