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
import type {
  GateData,
  WireData,
  CircuitData,
  Position,
  LabelConnectorData
} from '@shared/types/circuit'
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
  internalState?: Record<string, unknown>
}

export interface LabelConnectorNodeData {
  [key: string]: unknown
  label: string
  isOutput: boolean
}

export type CircuitNodeData = GateNodeData | LabelConnectorNodeData

export interface WireEdgeData {
  [key: string]: unknown
  state: StateType
}

export type GateNode = Node<GateNodeData>
export type LabelConnectorNode = Node<LabelConnectorNodeData>
// Unified node type used throughout the store
export type CircuitNode = Node<CircuitNodeData>
export type WireEdge = Edge<WireEdgeData>

interface CircuitState {
  // React Flow state
  nodes: CircuitNode[]
  edges: WireEdge[]

  // File state
  currentFilePath: string | null
  isDirty: boolean

  // Selection
  selectedNodeIds: string[]
  selectedEdgeIds: string[]

  // Actions
  onNodesChange: (changes: NodeChange<CircuitNode>[]) => void
  onEdgesChange: (changes: EdgeChange<WireEdge>[]) => void
  onConnect: (connection: Connection) => void

  addGate: (type: string, position: Position) => string
  removeGate: (id: string) => void
  updateGatePosition: (id: string, position: Position) => void
  updateGateParams: (id: string, params: Record<string, unknown>) => void

  addLabelConnector: (label: string, isOutput: boolean, position: Position) => string
  renameLabelConnector: (id: string, newLabel: string) => void

  addWire: (
    sourceId: string,
    sourcePort: number,
    targetId: string,
    targetPort: number
  ) => string | null
  removeWire: (id: string) => void

  updateGateState: (
    gateId: string,
    inputStates: StateType[],
    outputStates: StateType[],
    internalState?: Record<string, unknown>
  ) => void
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
  DISPLAY_1D: { inputs: 4, outputs: 0, label: '1D' },
  DISPLAY_2D: { inputs: 8, outputs: 0, label: '2D' },
  KEYPAD: { inputs: 0, outputs: 4, label: 'KEY' },
  D_FLIPFLOP: { inputs: 2, outputs: 2, label: 'D-FF' },
  JK_FLIPFLOP: { inputs: 3, outputs: 2, label: 'JK-FF' },
  // Multiplexers
  MUX_2TO1: { inputs: 3, outputs: 1, label: 'MUX 2:1' },
  MUX_4TO1: { inputs: 6, outputs: 1, label: 'MUX 4:1' },
  MUX_8TO1: { inputs: 11, outputs: 1, label: 'MUX 8:1' },
  // Demultiplexers
  DEMUX_1TO2: { inputs: 2, outputs: 2, label: 'DEMUX 1:2' },
  DEMUX_1TO4: { inputs: 3, outputs: 4, label: 'DEMUX 1:4' },
  // Decoders
  DECODER_2TO4: { inputs: 3, outputs: 4, label: 'DEC 2:4' },
  DECODER_3TO8: { inputs: 4, outputs: 8, label: 'DEC 3:8' },
  // Encoders
  ENCODER_4TO2: { inputs: 4, outputs: 3, label: 'ENC 4:2' },
  ENCODER_8TO3: { inputs: 8, outputs: 4, label: 'ENC 8:3' },
  // Arithmetic
  FULL_ADDER: { inputs: 3, outputs: 2, label: 'FA' },
  ADDER_4BIT: { inputs: 9, outputs: 6, label: 'ADD4' },
  // Comparators
  COMPARATOR_1BIT: { inputs: 5, outputs: 3, label: 'CMP1' },
  COMPARATOR_4BIT: { inputs: 11, outputs: 3, label: 'CMP4' },
  // Registers
  REGISTER_4BIT: { inputs: 7, outputs: 4, label: 'REG4' },
  REGISTER_8BIT: { inputs: 11, outputs: 8, label: 'REG8' },
  SHIFT_REG_4BIT: { inputs: 5, outputs: 5, label: 'SREG4' },
  COUNTER_4BIT: { inputs: 9, outputs: 5, label: 'CNT4' },
  // Memory
  RAM_16X4: { inputs: 10, outputs: 4, label: 'RAM' },
  RAM_16X8: { inputs: 14, outputs: 8, label: 'RAM' },
  ROM_16X4: { inputs: 5, outputs: 4, label: 'ROM' },
  ROM_16X8: { inputs: 5, outputs: 8, label: 'ROM' }
}

let nodeIdCounter = 1
let edgeIdCounter = 1
let labelConnectorIdCounter = 1

function generateNodeId(): string {
  return `gate_${nodeIdCounter++}`
}

function generateEdgeId(): string {
  return `wire_${edgeIdCounter++}`
}

function generateLabelConnectorId(): string {
  return `lc_${labelConnectorIdCounter++}`
}

function isLabelConnectorNode(node: CircuitNode): boolean {
  return node.type === 'label-connector'
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
      if (!connection.source || !connection.target) return

      const { nodes } = get()
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)

      if (!sourceNode || !targetNode) return

      const isLabelLink = isLabelConnectorNode(sourceNode) || isLabelConnectorNode(targetNode)

      if (isLabelLink) {
        // Create a label-link edge
        const state = get()
        const exists = state.edges.some(
          (e) =>
            e.source === connection.source &&
            e.target === connection.target &&
            e.sourceHandle === connection.sourceHandle &&
            e.targetHandle === connection.targetHandle
        )
        if (exists) return

        const id = generateEdgeId()
        const newEdge: WireEdge = {
          id,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? undefined,
          targetHandle: connection.targetHandle ?? undefined,
          type: 'label-link',
          data: { state: StateType.UNKNOWN }
        }
        set((state) => ({
          edges: [...state.edges, newEdge],
          isDirty: true
        }))
      } else {
        // Regular wire connection
        const sourcePort = parseInt(connection.sourceHandle?.replace('output-', '') ?? '0')
        const targetPort = parseInt(connection.targetHandle?.replace('input-', '') ?? '0')
        get().addWire(connection.source, sourcePort, connection.target, targetPort)
      }
    },

    addGate: (type, position) => {
      const config = GATE_CONFIGS[type]
      if (!config) {
        console.error(`Unknown gate type: ${type}`)
        return ''
      }

      const id = generateNodeId()
      const newNode: CircuitNode = {
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
        } as GateNodeData
      }

      set((state) => ({
        nodes: [...state.nodes, newNode],
        isDirty: true
      }))

      return id
    },

    addLabelConnector: (label, isOutput, position) => {
      const id = generateLabelConnectorId()
      const newNode: CircuitNode = {
        id,
        type: 'label-connector',
        position,
        data: {
          label,
          isOutput
        } as LabelConnectorNodeData
      }

      set((state) => ({
        nodes: [...state.nodes, newNode],
        isDirty: true
      }))

      return id
    },

    renameLabelConnector: (id, newLabel) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id && n.type === 'label-connector'
            ? ({ ...n, data: { ...n.data, label: newLabel } } as CircuitNode)
            : n
        ),
        isDirty: true
      }))
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
          n.id === id && n.type === 'gate'
            ? ({
                ...n,
                data: { ...n.data, params: { ...(n.data as GateNodeData).params, ...params } }
              } as CircuitNode)
            : n
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

    updateGateState: (gateId, inputStates, outputStates, internalState?) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === gateId && n.type === 'gate'
            ? ({
                ...n,
                data: {
                  ...n.data,
                  inputStates,
                  outputStates,
                  ...(internalState !== undefined ? { internalState } : {})
                }
              } as CircuitNode)
            : n
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
      labelConnectorIdCounter = 1
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
      labelConnectorIdCounter = 1

      const nodes: CircuitNode[] = circuit.gates.map((gate) => {
        const config = GATE_CONFIGS[gate.type] ?? { inputs: 2, outputs: 1, label: gate.type }
        const id = gate.id
        const numId = parseInt(id.replace(/\D/g, ''))
        if (!isNaN(numId) && numId >= nodeIdCounter) {
          nodeIdCounter = numId + 1
        }

        // Respect _inputCount/_outputCount overrides from CDL parser
        const inputCount = gate.params['_inputCount']
          ? parseInt(gate.params['_inputCount'])
          : config.inputs
        const outputCount = gate.params['_outputCount']
          ? parseInt(gate.params['_outputCount'])
          : config.outputs

        return {
          id,
          type: 'gate' as const,
          position: gate.position,
          data: {
            type: gate.type,
            label: config.label,
            inputCount,
            outputCount,
            inputStates: Array<StateType>(inputCount).fill(StateType.UNKNOWN),
            outputStates: Array<StateType>(outputCount).fill(StateType.UNKNOWN),
            params: gate.params
          } as GateNodeData
        } as CircuitNode
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
          type: 'wire' as const,
          data: {
            state: StateType.UNKNOWN
          }
        }
      })

      // Load label connectors
      if (circuit.labelConnectors && circuit.labelConnectors.length > 0) {
        for (const lc of circuit.labelConnectors) {
          const numId = parseInt(lc.id.replace(/\D/g, ''))
          if (!isNaN(numId) && numId >= labelConnectorIdCounter) {
            labelConnectorIdCounter = numId + 1
          }

          const lcNode: CircuitNode = {
            id: lc.id,
            type: 'label-connector',
            position: lc.position,
            data: {
              label: lc.label,
              isOutput: lc.isOutput
            } as LabelConnectorNodeData
          }
          nodes.push(lcNode)

          // Create label-link edge connecting the connector to its gate port
          if (lc.connectedGateId) {
            const linkId = generateEdgeId()
            if (lc.isOutput) {
              // Output connector: gate output → label connector (target handle)
              edges.push({
                id: linkId,
                source: lc.connectedGateId,
                target: lc.id,
                sourceHandle: `output-${lc.connectedPortIndex}`,
                targetHandle: 'target',
                type: 'label-link',
                data: { state: StateType.UNKNOWN }
              })
            } else {
              // Input connector: label connector (source handle) → gate input
              edges.push({
                id: linkId,
                source: lc.id,
                target: lc.connectedGateId,
                sourceHandle: 'source',
                targetHandle: `input-${lc.connectedPortIndex}`,
                type: 'label-link',
                data: { state: StateType.UNKNOWN }
              })
            }
          }
        }
      }

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

      // Partition nodes into gates vs label connectors
      const gateNodes = nodes.filter((n) => n.type === 'gate')
      const lcNodes = nodes.filter((n) => n.type === 'label-connector')

      // Partition edges into signal wires vs label-links
      const signalEdges = edges.filter((e) => e.type !== 'label-link')
      const labelLinkEdges = edges.filter((e) => e.type === 'label-link')

      const gates: GateData[] = gateNodes.map((node) => ({
        id: node.id,
        type: (node.data as GateNodeData).type,
        position: node.position,
        inputs: [],
        outputs: [],
        params: (node.data as GateNodeData).params as Record<string, string>
      }))

      const wires: WireData[] = signalEdges.map((edge) => ({
        id: edge.id,
        sourceGateId: edge.source,
        sourcePortIndex: parseInt(edge.sourceHandle?.replace('output-', '') ?? '0'),
        targetGateId: edge.target,
        targetPortIndex: parseInt(edge.targetHandle?.replace('input-', '') ?? '0'),
        points: []
      }))

      // Extract label connector data by resolving connected gate/port from label-link edges
      const labelConnectors: LabelConnectorData[] = lcNodes.map((node) => {
        const lcData = node.data as LabelConnectorNodeData

        // Find the label-link edge connecting this connector to a gate
        let connectedGateId = ''
        let connectedPortIndex = 0

        for (const edge of labelLinkEdges) {
          if (lcData.isOutput && edge.target === node.id) {
            // Output connector: gate output → connector
            connectedGateId = edge.source
            connectedPortIndex = parseInt(edge.sourceHandle?.replace('output-', '') ?? '0')
            break
          } else if (!lcData.isOutput && edge.source === node.id) {
            // Input connector: connector → gate input
            connectedGateId = edge.target
            connectedPortIndex = parseInt(edge.targetHandle?.replace('input-', '') ?? '0')
            break
          }
        }

        return {
          id: node.id,
          label: lcData.label,
          isOutput: lcData.isOutput,
          position: node.position,
          connectedGateId,
          connectedPortIndex
        }
      })

      return {
        format: 'metalogic',
        version: '1.0.0',
        gates,
        wires,
        labelConnectors: labelConnectors.length > 0 ? labelConnectors : undefined
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
