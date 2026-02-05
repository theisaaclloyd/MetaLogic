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
  useReactFlow
} from '@xyflow/react'
import { useCircuitStore, type GateNode } from '../../stores/circuitStore'
import { GateNodeComponent } from '../nodes/BaseGateNode'
import { WireEdge as WireEdgeComponent } from '../edges/WireEdge'

const nodeTypes: NodeTypes = {
  gate: GateNodeComponent
}

const edgeTypes: EdgeTypes = {
  wire: WireEdgeComponent
}

export function CircuitCanvas() {
  const reactFlow = useReactFlow()
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addGate, setSelection } =
    useCircuitStore()

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

      const gateType = event.dataTransfer.getData('application/metalogic-gate')
      if (!gateType) return

      // Get the position relative to the canvas
      // const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      // const position = {
      //   x: event.clientX - reactFlowBounds.left,
      //   y: event.clientY - reactFlowBounds.top
      // }

      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      })

      addGate(gateType, position)
    },
    [addGate, reactFlow]
  )

  const minimapNodeColor = useCallback((node: GateNode) => {
    switch (node.data.type) {
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
