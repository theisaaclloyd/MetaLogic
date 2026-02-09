import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMemoryEditorStore } from '../../stores/memoryEditorStore'
import { useCircuitStore, type GateNode } from '../../stores/circuitStore'
import { useSimulationStore } from '../../stores/simulationStore'
import { StateType } from '../../simulation/types/state'

const ADDRESSES = 16

function stateArrayToHex(bits: StateType[], width: number): string {
  let val = 0
  for (let i = 0; i < width; i++) {
    if (bits[i] === StateType.ONE) val |= 1 << i
  }
  return val
    .toString(16)
    .toUpperCase()
    .padStart(width <= 4 ? 1 : 2, '0')
}

function stateArrayToBinary(bits: StateType[], width: number): string {
  let str = ''
  for (let i = width - 1; i >= 0; i--) {
    str += bits[i] === StateType.ONE ? '1' : '0'
  }
  return str
}

function hexToStateArray(hex: string, width: number): StateType[] {
  const val = parseInt(hex, 16)
  const bits: StateType[] = []
  for (let i = 0; i < width; i++) {
    bits.push(val & (1 << i) ? StateType.ONE : StateType.ZERO)
  }
  return bits
}

function getAddressFromInputs(inputStates: StateType[]): number {
  for (let i = 0; i < 4; i++) {
    const s = inputStates[i]
    if (s !== StateType.ZERO && s !== StateType.ONE) return -1
  }
  let val = 0
  for (let i = 0; i < 4; i++) {
    if (inputStates[i] === StateType.ONE) val |= 1 << i
  }
  return val
}

function parseCdmContent(content: string, dataWidth: number): Record<string, StateType[]> {
  const memory: Record<string, StateType[]> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue
    const [addrStr, dataStr] = trimmed.split(':')
    if (!addrStr || !dataStr) continue
    const addr = parseInt(addrStr.trim(), 16)
    if (isNaN(addr) || addr >= ADDRESSES) continue
    const data = parseInt(dataStr.trim(), 16)
    if (isNaN(data)) continue
    const bits: StateType[] = []
    for (let i = 0; i < dataWidth; i++) {
      bits.push(data & (1 << i) ? StateType.ONE : StateType.ZERO)
    }
    memory[addr.toString()] = bits
  }
  return memory
}

export function MemoryEditorModal() {
  const editingGateId = useMemoryEditorStore((s) => s.editingGateId)
  const closeEditor = useMemoryEditorStore((s) => s.closeEditor)
  const nodes = useCircuitStore((s) => s.nodes)
  const setMemoryData = useSimulationStore((s) => s.setMemoryData)
  const backdropRef = useRef<HTMLDivElement>(null)

  const node = useMemo<GateNode | undefined>(
    () =>
      editingGateId
        ? (nodes.find((n) => n.id === editingGateId && n.type === 'gate') as GateNode | undefined)
        : undefined,
    [editingGateId, nodes]
  )

  // Auto-close if gate is deleted
  useEffect(() => {
    if (editingGateId && !node) closeEditor()
  }, [editingGateId, node, closeEditor])

  // Close on Escape
  useEffect(() => {
    if (!editingGateId) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEditor()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingGateId, closeEditor])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) closeEditor()
    },
    [closeEditor]
  )

  const dataWidth = node?.data.type.endsWith('X8') ? 8 : 4
  const rawMemory = node?.data.internalState?.['memory'] as Record<string, StateType[]> | undefined
  const memory = useMemo(() => rawMemory ?? {}, [rawMemory])
  const currentAddr = node ? getAddressFromInputs(node.data.inputStates) : -1
  const isRom = node?.data.type.startsWith('ROM') ?? false

  const handleCellChange = useCallback(
    (addr: number, hexValue: string) => {
      if (!editingGateId) return
      const newMemory = { ...memory }
      newMemory[addr.toString()] = hexToStateArray(hexValue, dataWidth)
      setMemoryData(editingGateId, newMemory)
    },
    [editingGateId, memory, dataWidth, setMemoryData]
  )

  const handleImport = useCallback(async () => {
    if (!editingGateId) return
    if (!window.electron) return
    try {
      const result = await window.electron.file.openMemory()
      if (!result) return
      const imported = parseCdmContent(result.content, dataWidth)
      // Merge with existing memory
      const newMemory = { ...memory, ...imported }
      setMemoryData(editingGateId, newMemory)
    } catch (error) {
      console.error('Failed to import .cdm file:', error)
    }
  }, [editingGateId, dataWidth, memory, setMemoryData])

  if (!editingGateId || !node) return null

  const maxHexChars = dataWidth <= 4 ? 1 : 2

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-600 w-[420px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div>
            <span className="text-sm font-semibold text-gray-200">
              {node.data.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-400 ml-2">{node.id}</span>
          </div>
          <button
            onClick={closeEditor}
            className="text-gray-400 hover:text-gray-200 text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Import button */}
        <div className="px-4 py-2 border-b border-gray-700">
          <button
            onClick={handleImport}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors"
          >
            Import .cdm
          </button>
          {isRom && <span className="text-xs text-gray-500 ml-2">Read-only in simulation</span>}
        </div>

        {/* Grid header */}
        <div className="grid grid-cols-[60px_1fr_1fr] gap-0 px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
          <div>Addr</div>
          <div>Hex</div>
          <div>Binary</div>
        </div>

        {/* Grid rows */}
        <div className="overflow-y-auto flex-1 px-4">
          {Array.from({ length: ADDRESSES }, (_, addr) => {
            const bits = memory[addr.toString()] ?? Array(dataWidth).fill(StateType.ZERO)
            const hexVal = stateArrayToHex(bits, dataWidth)
            const binVal = stateArrayToBinary(bits, dataWidth)
            const isHighlighted = addr === currentAddr

            return (
              <div
                key={addr}
                className={`grid grid-cols-[60px_1fr_1fr] gap-0 py-1 border-b border-gray-700/50 items-center ${
                  isHighlighted ? 'bg-green-900/40' : ''
                }`}
              >
                <div className="text-xs text-gray-400 font-mono">
                  {addr.toString(16).toUpperCase().padStart(1, '0')}
                </div>
                <div>
                  <HexInput
                    value={hexVal}
                    maxChars={maxHexChars}
                    onChange={(val) => handleCellChange(addr, val)}
                  />
                </div>
                <div className="text-xs text-gray-400 font-mono">{binVal}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function HexInput({
  value,
  maxChars,
  onChange
}: {
  value: string
  maxChars: number
  onChange: (val: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '')
      if (raw.length > maxChars) return
      onChange(raw || '0')
    },
    [maxChars, onChange]
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent event from propagating to ReactFlow (delete key, etc.)
    e.stopPropagation()
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="nopan nodrag w-12 bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
      spellCheck={false}
    />
  )
}
