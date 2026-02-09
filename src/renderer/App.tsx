import { useEffect, useCallback, useRef, useMemo } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { CircuitCanvas } from './components/canvas/CircuitCanvas'
import { GatePalette } from './components/panels/GatePalette'
import { SimulationControls } from './components/panels/SimulationControls'
import { PropertiesPanel } from './components/panels/PropertiesPanel'
import { MemoryEditorModal } from './components/panels/MemoryEditorModal'
import { ToastContainer } from './components/ui/ToastContainer'
import {
  useCircuitStore,
  type GateNodeData,
  type LabelConnectorNodeData
} from './stores/circuitStore'
import { useSimulationStore } from './stores/simulationStore'
import { useHistoryStore } from './stores/historyStore'
import { useToastStore } from './stores/toastStore'
import { synthesizeLabelConnectorWires } from './simulation/core/LabelConnectorResolver'
import {
  StateType,
  type GateState,
  type WireState,
  type WorkerResponse
} from './simulation/types/state'

import '@xyflow/react/dist/style.css'

function App() {
  const workerRef = useRef<Worker | null>(null)

  const {
    nodes,
    edges,
    newCircuit,
    loadCircuit,
    getCircuitData,
    currentFilePath,
    setFilePath,
    setDirty,
    updateGateState,
    updateWireState,
    deleteSelected
  } = useCircuitStore()

  const { setStatus, setCurrentTime, setWorker, run, pause, step, reset } = useSimulationStore()

  const { pushState, undo, redo, clear: clearHistory } = useHistoryStore()

  const addToast = useToastStore((s) => s.addToast)

  // Initialize Web Worker
  useEffect(() => {
    const worker = new Worker(new URL('./workers/simulation.worker.ts', import.meta.url), {
      type: 'module'
    })

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const response = e.data

      switch (response.type) {
        case 'ready':
          // Worker is ready
          break

        case 'stateUpdate':
          setCurrentTime(response.time)
          // Update gate states in store
          for (const gate of response.gates) {
            updateGateState(gate.id, gate.inputStates, gate.outputStates, gate.internalState)
          }
          // Update wire states in store
          for (const wire of response.wires) {
            updateWireState(wire.id, wire.state)
          }
          break

        case 'error':
          console.error('Simulation error:', response.message)
          setStatus('stopped')
          break
      }
    }

    workerRef.current = worker
    setWorker(worker)

    return () => {
      worker.terminate()
    }
  }, [setWorker, setCurrentTime, setStatus, updateGateState, updateWireState])

  // Build a topology fingerprint that only changes when circuit structure changes,
  // NOT when simulation state updates arrive (which would cause infinite re-init loop)
  const topologyKey = useMemo(() => {
    const nodeKeys = nodes
      .map((n) => {
        if (n.type === 'label-connector') {
          const lcData = n.data as LabelConnectorNodeData
          return `${n.id}:lc:${lcData.label}:${lcData.isOutput}`
        }
        return `${n.id}:${(n.data as GateNodeData).type}`
      })
      .sort()
      .join('|')
    const edgeKeys = edges
      .map((e) => `${e.id}:${e.source}:${e.sourceHandle}:${e.target}:${e.targetHandle}:${e.type}`)
      .sort()
      .join('|')
    return `${nodeKeys}||${edgeKeys}`
  }, [nodes, edges])

  // Diff-based incremental sync: only send add/remove messages for changed parts
  const prevNodesRef = useRef<Map<string, string>>(new Map()) // id → type
  const prevEdgesRef = useRef<Map<string, string>>(new Map()) // id → connection key
  const forceFullInitRef = useRef(true)
  const prevTopologyRef = useRef<string>('')

  useEffect(() => {
    if (!workerRef.current) return
    if (topologyKey === prevTopologyRef.current) return
    prevTopologyRef.current = topologyKey

    const worker = workerRef.current

    // Filter out label-connector nodes (they aren't simulation gates)
    const gateNodes = nodes.filter((n) => n.type !== 'label-connector')
    // Filter out label-link edges (not real signal wires)
    const signalEdges = edges.filter((e) => e.type !== 'label-link')

    // Synthesize virtual wires from label connectors
    const synthesizedWires = synthesizeLabelConnectorWires(nodes, edges)

    // Helper to build gate/wire state
    const makeGate = (node: (typeof gateNodes)[number]): GateState => ({
      id: node.id,
      type: (node.data as GateNodeData).type,
      inputStates: (node.data as GateNodeData).inputStates,
      outputStates: (node.data as GateNodeData).outputStates,
      internalState: (node.data as GateNodeData).params
    })

    const makeWire = (edge: (typeof signalEdges)[number]): WireState => ({
      id: edge.id,
      state: edge.data?.state ?? StateType.UNKNOWN,
      sourceGateId: edge.source,
      sourcePortIndex: parseInt(edge.sourceHandle?.replace('output-', '') ?? '0'),
      targetGateId: edge.target,
      targetPortIndex: parseInt(edge.targetHandle?.replace('input-', '') ?? '0')
    })

    if (forceFullInitRef.current) {
      // Full init for first render, newCircuit, loadCircuit
      forceFullInitRef.current = false
      const gates = gateNodes.map(makeGate)
      const wires = [...signalEdges.map(makeWire), ...synthesizedWires]
      worker.postMessage({ type: 'init', gates, wires })
    } else {
      // Diff-based incremental update
      const currentNodes = new Map(gateNodes.map((n) => [n.id, (n.data as GateNodeData).type]))
      const currentEdges = new Map(
        signalEdges.map((e) => [
          e.id,
          `${e.source}:${e.sourceHandle}:${e.target}:${e.targetHandle}`
        ])
      )

      // Find removed edges first (must remove before removing nodes)
      for (const edgeId of prevEdgesRef.current.keys()) {
        if (!currentEdges.has(edgeId)) {
          worker.postMessage({ type: 'removeWire', wireId: edgeId })
        }
      }

      // Find removed nodes
      for (const nodeId of prevNodesRef.current.keys()) {
        if (!currentNodes.has(nodeId)) {
          worker.postMessage({ type: 'removeGate', gateId: nodeId })
        }
      }

      // Find added nodes (must add before adding edges)
      for (const node of gateNodes) {
        if (!prevNodesRef.current.has(node.id)) {
          worker.postMessage({ type: 'addGate', gate: makeGate(node) })
        }
      }

      // Find added edges
      for (const edge of signalEdges) {
        if (!prevEdgesRef.current.has(edge.id)) {
          worker.postMessage({ type: 'addWire', wire: makeWire(edge) })
        }
      }

      // For synthesized wires, always do a full re-init when topology changes
      // This handles label connector changes properly
      if (synthesizedWires.length > 0) {
        const gates = gateNodes.map(makeGate)
        const wires = [...signalEdges.map(makeWire), ...synthesizedWires]
        worker.postMessage({ type: 'init', gates, wires })
      }
    }

    // Update refs for next diff (only gate nodes and signal edges)
    prevNodesRef.current = new Map(gateNodes.map((n) => [n.id, (n.data as GateNodeData).type]))
    prevEdgesRef.current = new Map(
      signalEdges.map((e) => [e.id, `${e.source}:${e.sourceHandle}:${e.target}:${e.targetHandle}`])
    )
  }, [topologyKey, nodes, edges])

  const handleNew = useCallback(() => {
    forceFullInitRef.current = true
    newCircuit()
    clearHistory()
    reset()
  }, [newCircuit, clearHistory, reset])

  const handleOpen = useCallback(async () => {
    if (!window.electron) {
      console.error('[App] window.electron not available — preload may have failed')
      return
    }

    try {
      const result = await window.electron.file.open()
      if (result) {
        forceFullInitRef.current = true
        loadCircuit(result.circuit, result.filePath)
        clearHistory()
        reset()

        // Show parse warnings as toasts
        if (result.warnings && result.warnings.length > 0) {
          for (const w of result.warnings) {
            switch (w.type) {
              case 'import_info':
                addToast('info', w.message)
                break
              case 'unsupported_gate':
                addToast('warning', w.message)
                break
              case 'approximate_mapping':
                addToast('warning', w.message)
                break
              case 'label_conflict':
                addToast('warning', w.message)
                break
              default:
                addToast('warning', w.message)
            }
          }
        }
      }
    } catch (error) {
      console.error('[App] handleOpen failed:', error)
      addToast('error', `Failed to open file: ${String(error)}`)
    }
  }, [loadCircuit, clearHistory, reset, addToast])

  const handleSaveAs = useCallback(async () => {
    if (!window.electron) {
      console.error('[App] window.electron not available — preload may have failed')
      return
    }

    try {
      const circuit = getCircuitData()
      const result = await window.electron.file.saveAs(circuit)
      if (result?.success && result.filePath) {
        setFilePath(result.filePath)
        setDirty(false)
        addToast('success', `Saved as ${result.filePath.split('/').pop()}`)
      }
    } catch (error) {
      console.error('[App] handleSaveAs failed:', error)
      addToast('error', `Failed to save: ${String(error)}`)
    }
  }, [getCircuitData, setFilePath, setDirty, addToast])

  const handleSave = useCallback(async () => {
    if (!window.electron) {
      console.error('[App] window.electron not available — preload may have failed')
      return
    }

    try {
      if (currentFilePath) {
        const circuit = getCircuitData()
        const result = await window.electron.file.save({ filePath: currentFilePath, circuit })
        if (result.success) {
          setDirty(false)
          addToast('success', `Saved ${currentFilePath.split('/').pop()}`)
        }
      } else {
        await handleSaveAs()
      }
    } catch (error) {
      console.error('[App] handleSave failed:', error)
      addToast('error', `Failed to save: ${String(error)}`)
    }
  }, [currentFilePath, getCircuitData, setDirty, handleSaveAs, addToast])

  const handleUndo = useCallback(() => {
    const entry = undo()
    if (entry) {
      useCircuitStore.setState({
        nodes: entry.nodes,
        edges: entry.edges,
        isDirty: true
      })
    }
  }, [undo])

  const handleRedo = useCallback(() => {
    const entry = redo()
    if (entry) {
      useCircuitStore.setState({
        nodes: entry.nodes,
        edges: entry.edges,
        isDirty: true
      })
    }
  }, [redo])

  // Handle menu commands from Electron
  useEffect(() => {
    if (!window.electron) return

    const unsubscribe = window.electron.onMenuCommand((command) => {
      switch (command) {
        case 'new':
          handleNew()
          break
        case 'open':
          void handleOpen()
          break
        case 'save':
          void handleSave()
          break
        case 'save-as':
          void handleSaveAs()
          break
        case 'undo':
          handleUndo()
          break
        case 'redo':
          handleRedo()
          break
        case 'delete':
          deleteSelected()
          break
        case 'sim-run':
          run()
          break
        case 'sim-pause':
          pause()
          break
        case 'sim-step':
          step()
          break
        case 'sim-reset':
          reset()
          break
      }
    })

    return unsubscribe
  }, [
    deleteSelected,
    run,
    pause,
    step,
    reset,
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleUndo,
    handleRedo
  ])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName !== 'INPUT') {
          deleteSelected()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteSelected])

  // Save history on significant changes
  const prevNodesLengthRef = useRef(nodes.length)
  const prevEdgesLengthRef = useRef(edges.length)

  useEffect(() => {
    if (
      nodes.length !== prevNodesLengthRef.current ||
      edges.length !== prevEdgesLengthRef.current
    ) {
      pushState(nodes, edges)
      prevNodesLengthRef.current = nodes.length
      prevEdgesLengthRef.current = edges.length
    }
  }, [nodes, edges, pushState])

  return (
    <div className="flex h-screen w-screen bg-gray-900">
      {/* Left Panel - Gate Palette */}
      <GatePalette />

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <CircuitCanvas />
        </ReactFlowProvider>

        {/* Simulation Controls Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <SimulationControls />
        </div>
      </div>

      {/* Right Panel - Properties */}
      <PropertiesPanel />

      {/* Memory Editor Modal */}
      <MemoryEditorModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}

export default App
