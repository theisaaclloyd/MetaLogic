import { useCallback } from 'react'
import {
  useCircuitStore,
  type GateNode,
  type WireEdge,
  type CircuitNode,
  type LabelConnectorNodeData
} from '../../stores/circuitStore'
import { StateType } from '../../simulation/types/state'

const STATE_NAMES: Record<StateType, string> = {
  [StateType.ZERO]: '0 (Low)',
  [StateType.ONE]: '1 (High)',
  [StateType.HI_Z]: 'Hi-Z',
  [StateType.CONFLICT]: 'Conflict',
  [StateType.UNKNOWN]: 'Unknown'
}

export function PropertiesPanel() {
  const { nodes, edges, selectedNodeIds, selectedEdgeIds, updateGateParams, renameLabelConnector } =
    useCircuitStore()

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id))
  const selectedEdges = edges.filter((e) => selectedEdgeIds.includes(e.id))

  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0

  // Count label connectors and gates separately
  const labelConnectorCount = nodes.filter((n) => n.type === 'label-connector').length
  const gateCount = nodes.filter((n) => n.type === 'gate').length
  const signalWireCount = edges.filter((e) => e.type !== 'label-link').length
  const labelLinkCount = edges.filter((e) => e.type === 'label-link').length

  return (
    <div className="w-64 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-3">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Properties</h2>

        {!hasSelection && (
          <p className="text-xs text-gray-500">
            Select a component or wire to view its properties.
          </p>
        )}

        {selectedNodes.length === 1 &&
          selectedNodes[0] &&
          (selectedNodes[0].type === 'label-connector' ? (
            <LabelConnectorProperties
              node={selectedNodes[0] as CircuitNode}
              edges={edges}
              nodes={nodes as CircuitNode[]}
              onRename={(newLabel) => renameLabelConnector(selectedNodes[0]!.id, newLabel)}
            />
          ) : (
            <GateProperties
              node={selectedNodes[0] as GateNode}
              onParamChange={(key, value) =>
                updateGateParams(selectedNodes[0]!.id, { [key]: value })
              }
            />
          ))}

        {selectedNodes.length > 1 && (
          <div className="text-xs text-gray-400">{selectedNodes.length} components selected</div>
        )}

        {selectedEdges.length === 1 && selectedNodes.length === 0 && selectedEdges[0] && (
          <WireProperties edge={selectedEdges[0]} />
        )}

        {selectedEdges.length > 1 && selectedNodes.length === 0 && (
          <div className="text-xs text-gray-400">{selectedEdges.length} wires selected</div>
        )}
      </div>

      {/* Circuit Statistics */}
      <div className="p-3 border-t border-gray-700">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Circuit Stats
        </h3>
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>Gates:</span>
            <span className="text-gray-300">{gateCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Wires:</span>
            <span className="text-gray-300">{signalWireCount}</span>
          </div>
          {labelConnectorCount > 0 && (
            <>
              <div className="flex justify-between">
                <span>Label connectors:</span>
                <span className="text-emerald-400">{labelConnectorCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Label links:</span>
                <span className="text-emerald-400">{labelLinkCount}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface GatePropertiesProps {
  node: GateNode
  onParamChange: (key: string, value: unknown) => void
}

function GateProperties({ node, onParamChange }: GatePropertiesProps) {
  const { data } = node

  return (
    <div className="space-y-3">
      {/* Gate Type */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</label>
        <div className="mt-1 text-sm text-gray-200">{data.type}</div>
      </div>

      {/* Gate ID */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</label>
        <div className="mt-1 text-sm text-gray-400 font-mono">{node.id}</div>
      </div>

      {/* Position */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Position
        </label>
        <div className="mt-1 text-sm text-gray-400">
          ({Math.round(node.position.x)}, {Math.round(node.position.y)})
        </div>
      </div>

      {/* Input States */}
      {data.inputCount > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Inputs
          </label>
          <div className="mt-1 space-y-1">
            {data.inputStates.map((state, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-400">Input {i}:</span>
                <span className={getStateColorClass(state)}>{STATE_NAMES[state]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output States */}
      {data.outputCount > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Outputs
          </label>
          <div className="mt-1 space-y-1">
            {data.outputStates.map((state, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-400">Output {i}:</span>
                <span className={getStateColorClass(state)}>{STATE_NAMES[state]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clock-specific properties */}
      {data.type === 'CLOCK' && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Period
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={(data.params['period'] as number) ?? 10}
            onChange={(e) => onParamChange('period', parseInt(e.target.value))}
            className="mt-1 w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
      )}
    </div>
  )
}

interface LabelConnectorPropertiesProps {
  node: CircuitNode
  edges: {
    id: string
    source: string
    target: string
    type?: string
    sourceHandle?: string | null
    targetHandle?: string | null
  }[]
  nodes: CircuitNode[]
  onRename: (newLabel: string) => void
}

function LabelConnectorProperties({ node, edges, nodes, onRename }: LabelConnectorPropertiesProps) {
  const lcData = node.data as LabelConnectorNodeData

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onRename(e.target.value)
    },
    [onRename]
  )

  // Find connected gate from label-link edges
  let connectedGateId = ''
  let connectedPort = ''
  for (const edge of edges) {
    if (edge.type !== 'label-link') continue
    if (lcData.isOutput && edge.target === node.id) {
      connectedGateId = edge.source
      connectedPort = edge.sourceHandle?.replace('output-', 'Out ') ?? ''
      break
    } else if (!lcData.isOutput && edge.source === node.id) {
      connectedGateId = edge.target
      connectedPort = edge.targetHandle?.replace('input-', 'In ') ?? ''
      break
    }
  }

  // Count matching connectors with same label
  const matchingCount = nodes.filter(
    (n) =>
      n.type === 'label-connector' &&
      (n.data as unknown as LabelConnectorNodeData).label === lcData.label
  ).length

  return (
    <div className="space-y-3">
      {/* Label Name */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Label Name
        </label>
        <input
          type="text"
          value={lcData.label}
          onChange={handleLabelChange}
          className="mt-1 w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-emerald-300"
          placeholder="Enter label name"
        />
      </div>

      {/* Direction */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Direction
        </label>
        <div className="mt-1 text-sm text-emerald-400">
          {lcData.isOutput ? 'Output (broadcasts)' : 'Input (receives)'}
        </div>
      </div>

      {/* ID */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</label>
        <div className="mt-1 text-sm text-gray-400 font-mono">{node.id}</div>
      </div>

      {/* Connected Gate */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Connected To
        </label>
        <div className="mt-1 text-sm text-gray-400">
          {connectedGateId ? (
            <span className="font-mono">
              {connectedGateId} {connectedPort}
            </span>
          ) : (
            <span className="text-gray-500 italic">Not connected</span>
          )}
        </div>
      </div>

      {/* Matching Count */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Matching Connectors
        </label>
        <div className="mt-1 text-sm text-gray-300">{matchingCount}</div>
      </div>
    </div>
  )
}

interface WirePropertiesProps {
  edge: WireEdge
}

function WireProperties({ edge }: WirePropertiesProps) {
  const state = edge.data?.state ?? StateType.UNKNOWN

  return (
    <div className="space-y-3">
      {/* Wire ID */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Wire ID
        </label>
        <div className="mt-1 text-sm text-gray-400 font-mono">{edge.id}</div>
      </div>

      {/* Connection */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Connection
        </label>
        <div className="mt-1 text-xs text-gray-400">
          <span className="font-mono">{edge.source}</span>
          <span className="text-gray-500"> → </span>
          <span className="font-mono">{edge.target}</span>
        </div>
      </div>

      {/* State */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">State</label>
        <div className={`mt-1 text-sm ${getStateColorClass(state)}`}>{STATE_NAMES[state]}</div>
      </div>
    </div>
  )
}

function getStateColorClass(state: StateType): string {
  switch (state) {
    case StateType.ZERO:
      return 'text-blue-400'
    case StateType.ONE:
      return 'text-red-400'
    case StateType.HI_Z:
      return 'text-gray-400'
    case StateType.CONFLICT:
      return 'text-amber-400'
    case StateType.UNKNOWN:
      return 'text-purple-400'
    default:
      return 'text-gray-400'
  }
}
