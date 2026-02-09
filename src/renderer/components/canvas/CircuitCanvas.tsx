import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
  SelectionMode,
  ConnectionLineType,
  BackgroundVariant,
  PanelPosition,
  useReactFlow,
  type Node
} from '@xyflow/react'
import { useCircuitStore, type CircuitNode, type GateNodeData } from '../../stores/circuitStore'
import { useMemoryEditorStore } from '../../stores/memoryEditorStore'
import { GateNodeComponent } from '../nodes/BaseGateNode'
import { LabelConnectorNodeComponent } from '../nodes/LabelConnectorNode'
import { WireEdge as WireEdgeComponent } from '../edges/WireEdge'
import { LabelLinkEdge } from '../edges/LabelLinkEdge'

const nodeTypes: NodeTypes = {
  gate: GateNodeComponent,
  'label-connector': LabelConnectorNodeComponent
}

const edgeTypes: EdgeTypes = {
  wire: WireEdgeComponent,
  'label-link': LabelLinkEdge
}

const MEMORY_TYPES = new Set(['RAM_16X4', 'RAM_16X8', 'ROM_16X4', 'ROM_16X8'])

export function CircuitCanvas() {
  const reactFlow = useReactFlow()
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addGate,
    addLabelConnector,
    setSelection
  } = useCircuitStore()
  const openEditor = useMemoryEditorStore((s) => s.openEditor)

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: CircuitNode) => {
      if (node.type === 'gate' && MEMORY_TYPES.has((node.data as GateNodeData).type)) {
        openEditor(node.id)
      }
    },
    [openEditor]
  )

  const handleSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const nodeIds = params.nodes.map((n) => n.id)
      const edgeIds = params.edges.map((e) => e.id)
      setSelection(nodeIds, edgeIds)
    },
    [setSelection]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })

      // Check for label connector drop
      const lcType = event.dataTransfer.getData('application/metalogic-label-connector')
      if (lcType) {
        const isOutput = lcType === 'LABEL_OUT'
        addLabelConnector('A', isOutput, position)
        return
      }

      // Check for gate drop
      const gateType = event.dataTransfer.getData('application/metalogic-gate')
      if (gateType) {
        addGate(gateType, position)
      }
    },
    [addGate, addLabelConnector, reactFlow]
  )

  const minimapNodeColor = useCallback((node: Node) => {
    if (node.type === 'label-connector') return '#10b981' // emerald for label connectors

    const data = node.data as Record<string, unknown>
    const gateType = data.type as string | undefined
    switch (gateType) {
      case 'TOGGLE':
      case 'CLOCK':
      case 'PULSE':
        return '#22c55e' // green for inputs
      case 'LED':
        return '#ef4444' // red for outputs
      default:
        return '#3b82f6' // blue for gates
    }
  }, [])

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'wire',
      animated: false
    }),
    []
  )

  return (
    <div className="w-full h-full" onDragOver={handleDragOver} onDrop={handleDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineType={ConnectionLineType.SmoothStep}
        selectionMode={SelectionMode.Partial}
        attributionPosition={'hidden' as PanelPosition}
        snapToGrid
        snapGrid={[10, 10]}
        fitView
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        panOnScroll
        zoomOnScroll
        panOnDrag={[1, 2]} // Middle and right click to pan
        selectNodesOnDrag={false}
        elevateNodesOnSelect
        className="bg-gray-900"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
          className="bg-gray-900"
        />
        <Controls showZoom showFitView showInteractive className="bg-gray-800 border-gray-700" />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="bg-gray-800 border-gray-700"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}
