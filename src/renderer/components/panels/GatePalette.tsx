import { useCallback } from 'react'
import { GATE_SYMBOLS } from '../icons/GateSymbols'

interface GateCategory {
  name: string
  gates: { type: string; label: string; description: string }[]
}

const GATE_CATEGORIES: GateCategory[] = [
  {
    name: 'Inputs',
    gates: [
      { type: 'TOGGLE', label: 'Switch', description: 'Toggle switch input' },
      { type: 'CLOCK', label: 'Clock', description: 'Clock signal generator' },
      { type: 'PULSE', label: 'Pulse', description: 'Momentary pulse button' }
    ]
  },
  {
    name: 'Outputs',
    gates: [{ type: 'LED', label: 'LED', description: 'LED indicator' }]
  },
  {
    name: 'Basic Gates',
    gates: [
      { type: 'AND', label: 'AND', description: 'AND gate - output high if all inputs high' },
      { type: 'OR', label: 'OR', description: 'OR gate - output high if any input high' },
      { type: 'NOT', label: 'NOT', description: 'Inverter - output opposite of input' },
      { type: 'XOR', label: 'XOR', description: 'XOR gate - output high if inputs differ' },
      { type: 'NAND', label: 'NAND', description: 'NAND gate - inverted AND' },
      { type: 'NOR', label: 'NOR', description: 'NOR gate - inverted OR' },
      { type: 'XNOR', label: 'XNOR', description: 'XNOR gate - inverted XOR' }
    ]
  },
  {
    name: 'Buffers',
    gates: [
      { type: 'BUFFER', label: 'Buffer', description: 'Buffer - signal amplifier' },
      { type: 'TRI_BUFFER', label: 'Tri-State', description: 'Tri-state buffer with enable' }
    ]
  },
  {
    name: 'Flip-Flops',
    gates: [
      {
        type: 'D_FLIPFLOP',
        label: 'D-FF',
        description: 'D flip-flop - captures data on clock edge'
      },
      { type: 'JK_FLIPFLOP', label: 'JK-FF', description: 'JK flip-flop - versatile flip-flop' }
    ]
  }
]

function GateItem({
  type,
  label,
  description
}: {
  type: string
  label: string
  description: string
}) {
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData('application/metalogic-gate', type)
      event.dataTransfer.effectAllowed = 'copy'
    },
    [type]
  )

  const Symbol = GATE_SYMBOLS[type]

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="
        p-2 rounded-md bg-gray-700 border border-gray-600
        cursor-grab hover:bg-gray-600 hover:border-gray-500
        transition-colors select-none
        flex items-center gap-2
      "
      title={description}
    >
      {Symbol && (
        <span className="text-gray-300 shrink-0">
          <Symbol size={24} />
        </span>
      )}
      <span className="text-sm font-medium text-gray-200">{label}</span>
    </div>
  )
}

export function GatePalette() {
  return (
    <div className="w-48 bg-gray-800 border-r border-gray-700 overflow-y-auto">
      <div className="p-3">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Components</h2>

        {GATE_CATEGORIES.map((category) => (
          <div key={category.name} className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {category.name}
            </h3>
            <div className="space-y-1">
              {category.gates.map((gate) => (
                <GateItem
                  key={gate.type}
                  type={gate.type}
                  label={gate.label}
                  description={gate.description}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Drag components onto the canvas to add them to your circuit.
        </p>
      </div>
    </div>
  )
}
