import { useCallback } from 'react'
import { GATE_PALETTE_ICONS } from '../icons/GateSymbols'

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
      { type: 'PULSE', label: 'Pulse', description: 'Momentary pulse button' },
      { type: 'KEYPAD', label: 'Keypad', description: '4x4 keypad - outputs 4-bit binary (0-15)' }
    ]
  },
  {
    name: 'Connectors',
    gates: [
      { type: 'LABEL_OUT', label: 'Label Out', description: 'Broadcasts signal by label name' },
      { type: 'LABEL_IN', label: 'Label In', description: 'Receives signal by label name' }
    ]
  },
  {
    name: 'Outputs',
    gates: [
      { type: 'LED', label: 'LED', description: 'LED indicator' },
      {
        type: 'DISPLAY_1D',
        label: '1-Digit',
        description: '1-digit decimal display (4-bit, 0-15)'
      },
      {
        type: 'DISPLAY_2D',
        label: '2-Digit',
        description: '2-digit decimal display (8-bit, 0-255)'
      }
    ]
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
  },
  {
    name: 'Multiplexers',
    gates: [
      { type: 'MUX_2TO1', label: 'Mux 2:1', description: '2-to-1 multiplexer' },
      { type: 'MUX_4TO1', label: 'Mux 4:1', description: '4-to-1 multiplexer' },
      { type: 'MUX_8TO1', label: 'Mux 8:1', description: '8-to-1 multiplexer' },
      { type: 'DEMUX_1TO2', label: 'Demux 1:2', description: '1-to-2 demultiplexer' },
      { type: 'DEMUX_1TO4', label: 'Demux 1:4', description: '1-to-4 demultiplexer' }
    ]
  },
  {
    name: 'Decoders/Encoders',
    gates: [
      { type: 'DECODER_2TO4', label: 'Dec 2:4', description: '2-to-4 decoder with enable' },
      { type: 'DECODER_3TO8', label: 'Dec 3:8', description: '3-to-8 decoder with enable' },
      { type: 'ENCODER_4TO2', label: 'Enc 4:2', description: '4-to-2 priority encoder' },
      { type: 'ENCODER_8TO3', label: 'Enc 8:3', description: '8-to-3 priority encoder' }
    ]
  },
  {
    name: 'Arithmetic',
    gates: [
      { type: 'FULL_ADDER', label: 'Full Adder', description: '1-bit full adder (A+B+Cin)' },
      { type: 'ADDER_4BIT', label: '4-bit Adder', description: '4-bit ripple-carry adder' },
      {
        type: 'COMPARATOR_1BIT',
        label: '1-bit Comp',
        description: '1-bit magnitude comparator (cascadable)'
      },
      { type: 'COMPARATOR_4BIT', label: '4-bit Comp', description: '4-bit magnitude comparator' }
    ]
  },
  {
    name: 'Registers',
    gates: [
      {
        type: 'REGISTER_4BIT',
        label: '4-bit Reg',
        description: '4-bit register with load and clear'
      },
      {
        type: 'REGISTER_8BIT',
        label: '8-bit Reg',
        description: '8-bit register with load and clear'
      },
      {
        type: 'SHIFT_REG_4BIT',
        label: 'Shift Reg',
        description: '4-bit bidirectional shift register'
      },
      {
        type: 'COUNTER_4BIT',
        label: '4-bit Counter',
        description: '4-bit up/down counter with parallel load'
      }
    ]
  },
  {
    name: 'Memory',
    gates: [
      { type: 'RAM_16X4', label: 'RAM 16x4', description: '16-address x 4-bit RAM' },
      { type: 'RAM_16X8', label: 'RAM 16x8', description: '16-address x 8-bit RAM' },
      { type: 'ROM_16X4', label: 'ROM 16x4', description: '16-address x 4-bit ROM' },
      { type: 'ROM_16X8', label: 'ROM 16x8', description: '16-address x 8-bit ROM' }
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
      if (type === 'LABEL_OUT' || type === 'LABEL_IN') {
        event.dataTransfer.setData('application/metalogic-label-connector', type)
      } else {
        event.dataTransfer.setData('application/metalogic-gate', type)
      }
      event.dataTransfer.effectAllowed = 'copy'
    },
    [type]
  )

  const Symbol = GATE_PALETTE_ICONS[type]

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
