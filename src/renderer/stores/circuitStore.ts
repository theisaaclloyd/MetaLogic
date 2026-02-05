import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react'
import type { GateData, WireData, CircuitData, Position } from '@shared/types/circuit'
import { StateType } from '../simulation/types/state'

export interface GateNodeData {
  [key: string]: unknown
  type: string
  label: string
  inputCount: number
  outputCount: number
  inputStates: StateType[]
  outputStates: StateType[]
  params: Record<string, unknown>
}

export interface WireEdgeData {
  [key: string]: unknown
  state: StateType
}

export type GateNode = Node<GateNodeData>
export type WireEdge = Edge<WireEdgeData>

interface CircuitState {
  // React Flow state
  nodes: GateNode[]
  edges: WireEdge[]

  // File state
  currentFilePath: string | null
  isDirty: boolean

  // Selection
  selectedNodeIds: string[]
  selectedEdgeIds: string[]

  // Actions
  onNodesChange: (changes: NodeChange<GateNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WireEdge>[]) => void
  onConnect: (connection: Connection) => void

  addGate: (type: string, position: Position) => string
  removeGate: (id: string) => void
  updateGatePosition: (id: string, position: Position) => void
  updateGateParams: (id: string, params: Record<string, unknown>) => void

  addWire: (
    sourceId: string,
    sourcePort: number,
    targetId: string,
    targetPort: number
  ) => string | null
  removeWire: (id: string) => void

  updateGateState: (gateId: string, inputStates: StateType[], outputStates: StateType[]) => void
  updateWireState: (wireId: string, state: StateType) => void

  setSelection: (nodeIds: string[], edgeIds: string[]) => void
  clearSelection: () => void
  deleteSelected: () => void

  // File operations
  newCircuit: () => void
  loadCircuit: (circuit: CircuitData, filePath?: string) => void
  getCircuitData: () => CircuitData
  setFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
}

// Gate type configurations
const GATE_CONFIGS: Record<string, { inputs: number; outputs: number; label: string }> = {
  AND: { inputs: 2, outputs: 1, label: 'AND' },
  OR: { inputs: 2, outputs: 1, label: 'OR' },
  NOT: { inputs: 1, outputs: 1, label: 'NOT' },
  XOR: { inputs: 2, outputs: 1, label: 'XOR' },
  NAND: { inputs: 2, outputs: 1, label: 'NAND' },
  NOR: { inputs: 2, outputs: 1, label: 'NOR' },
  XNOR: { inputs: 2, outputs: 1, label: 'XNOR' },
  BUFFER: { inputs: 1, outputs: 1, label: 'BUF' },
  TRI_BUFFER: { inputs: 2, outputs: 1, label: 'TRI' },
  TOGGLE: { inputs: 0, outputs: 1, label: 'SW' },
  CLOCK: { inputs: 0, outputs: 1, label: 'CLK' },
  PULSE: { inputs: 0, outputs: 1, label: 'PLS' },
  LED: { inputs: 1, outputs: 0, label: 'LED' },
  D_FLIPFLOP: { inputs: 2, outputs: 2, label: 'D-FF' },
  JK_FLIPFLOP: { inputs: 3, outputs: 2, label: 'JK-FF' }
}

let nodeIdCounter = 1
let edgeIdCounter = 1

function generateNodeId(): string {
  return `gate_${nodeIdCounter++}`
}

function generateEdgeId(): string {
  return `wire_${edgeIdCounter++}`
}

export const useCircuitStore = create<CircuitState>()(
  subscribeWithSelector((set, get) => ({
    nodes: [],
    edges: [],
    currentFilePath: null,
    isDirty: false,
    selectedNodeIds: [],
    selectedEdgeIds: [],

    onNodesChange: (changes) => {
      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
        isDirty: true
      }))
    },

    onEdgesChange: (changes) => {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
        isDirty: true
      }))
    },

    onConnect: (connection) => {
      const { addWire } = get()
      if (connection.source && connection.target) {
        const sourcePort = parseInt(connection.sourceHandle?.replace('output-', '') ?? '0')
        const targetPort = parseInt(connection.targetHandle?.replace('input-', '') ?? '0')
        addWire(connection.source, sourcePort, connection.target, targetPort)
      }
    },

    addGate: (type, position) => {
      const config = GATE_CONFIGS[type]
      if (!config) {
        console.error(`Unknown gate type: ${type}`)
        return ''
      }

      const id = generateNodeId()
      const newNode: GateNode = {
        id,
        type: 'gate',
        position,
        data: {
          type,
          label: config.label,
          inputCount: config.inputs,
          outputCount: config.outputs,
          inputStates: Array<StateType>(config.inputs).fill(StateType.UNKNOWN),
          outputStates: Array<StateType>(config.outputs).fill(StateType.UNKNOWN),
          params: {}
        }
      }

      set((state) => ({
        nodes: [...state.nodes, newNode],
        isDirty: true
      }))

      return id
    },

    removeGate: (id) => {
      set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== id),
        edges: state.edges.filter((e) => e.source !== id && e.target !== id),
        isDirty: true
      }))
    },

    updateGatePosition: (id, position) => {
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
        isDirty: true
      }))
    },

    updateGateParams: (id, params) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } } : n
        ),
        isDirty: true
      }))
    },

    addWire: (sourceId, sourcePort, targetId, targetPort) => {
      const state = get()

      // Check if wire already exists
      const exists = state.edges.some(
        (e) =>
          e.source === sourceId &&
          e.target === targetId &&
          e.sourceHandle === `output-${sourcePort}` &&
          e.targetHandle === `input-${targetPort}`
      )
      if (exists) return null

      const id = generateEdgeId()
      const newEdge: WireEdge = {
        id,
        source: sourceId,
        target: targetId,
        sourceHandle: `output-${sourcePort}`,
        targetHandle: `input-${targetPort}`,
        type: 'wire',
        data: {
          state: StateType.UNKNOWN
        }
      }

      set((state) => ({
        edges: [...state.edges, newEdge],
        isDirty: true
      }))

      return id
    },

    removeWire: (id) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id),
        isDirty: true
      }))
    },

    updateGateState: (gateId, inputStates, outputStates) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === gateId ? { ...n, data: { ...n.data, inputStates, outputStates } } : n
        )
      }))
    },

    updateWireState: (wireId, wireState) => {
      set((state) => ({
        edges: state.edges.map((e) =>
          e.id === wireId ? { ...e, data: { ...e.data, state: wireState } } : e
        )
      }))
    },

    setSelection: (nodeIds, edgeIds) => {
      set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds })
    },

    clearSelection: () => {
      set({ selectedNodeIds: [], selectedEdgeIds: [] })
    },

    deleteSelected: () => {
      const { selectedNodeIds, selectedEdgeIds, removeGate, removeWire } = get()

      for (const id of selectedEdgeIds) {
        removeWire(id)
      }
      for (const id of selectedNodeIds) {
        removeGate(id)
      }

      set({ selectedNodeIds: [], selectedEdgeIds: [] })
    },

    newCircuit: () => {
      nodeIdCounter = 1
      edgeIdCounter = 1
      set({
        nodes: [],
        edges: [],
        currentFilePath: null,
        isDirty: false,
        selectedNodeIds: [],
        selectedEdgeIds: []
      })
    },

    loadCircuit: (circuit, filePath) => {
      // Reset counters
      nodeIdCounter = 1
      edgeIdCounter = 1

      const nodes: GateNode[] = circuit.gates.map((gate) => {
        const config = GATE_CONFIGS[gate.type] ?? { inputs: 2, outputs: 1, label: gate.type }
        const id = gate.id
        const numId = parseInt(id.replace(/\D/g, ''))
        if (!isNaN(numId) && numId >= nodeIdCounter) {
          nodeIdCounter = numId + 1
        }

        return {
          id,
          type: 'gate',
          position: gate.position,
          data: {
            type: gate.type,
            label: config.label,
            inputCount: config.inputs,
            outputCount: config.outputs,
            inputStates: Array<StateType>(config.inputs).fill(StateType.UNKNOWN),
            outputStates: Array<StateType>(config.outputs).fill(StateType.UNKNOWN),
            params: gate.params
          }
        }
      })

      const edges: WireEdge[] = circuit.wires.map((wire) => {
        const id = wire.id
        const numId = parseInt(id.replace(/\D/g, ''))
        if (!isNaN(numId) && numId >= edgeIdCounter) {
          edgeIdCounter = numId + 1
        }

        return {
          id,
          source: wire.sourceGateId,
          target: wire.targetGateId,
          sourceHandle: `output-${wire.sourcePortIndex}`,
          targetHandle: `input-${wire.targetPortIndex}`,
          type: 'wire',
          data: {
            state: StateType.UNKNOWN
          }
        }
      })

      set({
        nodes,
        edges,
        currentFilePath: filePath ?? null,
        isDirty: false,
        selectedNodeIds: [],
        selectedEdgeIds: []
      })
    },

    getCircuitData: (): CircuitData => {
      const { nodes, edges } = get()

      const gates: GateData[] = nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        position: node.position,
        inputs: [],
        outputs: [],
        params: node.data.params as Record<string, string>
      }))

      const wires: WireData[] = edges.map((edge) => ({
        id: edge.id,
        sourceGateId: edge.source,
        sourcePortIndex: parseInt(edge.sourceHandle?.replace('output-', '') ?? '0'),
        targetGateId: edge.target,
        targetPortIndex: parseInt(edge.targetHandle?.replace('input-', '') ?? '0'),
        points: []
      }))

      return {
        version: '1.0.0',
        gates,
        wires
      }
    },

    setFilePath: (path) => {
      set({ currentFilePath: path })
    },

    setDirty: (dirty) => {
      set({ isDirty: dirty })
    }
  }))
)
