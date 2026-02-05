import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationEngine } from '../../src/renderer/simulation/core/SimulationEngine'
import { StateType, type GateState, type WireState } from '../../src/renderer/simulation/types/state'

describe('SimulationEngine', () => {
  let engine: SimulationEngine

  beforeEach(() => {
    engine = new SimulationEngine()
  })

  it('should initialize with empty state', () => {
    const snapshot = engine.getSnapshot()
    expect(snapshot.gates).toHaveLength(0)
    expect(snapshot.wires).toHaveLength(0)
    expect(snapshot.time).toBe(0)
  })

  it('should initialize gates and wires', () => {
    const gates: GateState[] = [
      { id: 'toggle1', type: 'TOGGLE', inputStates: [], outputStates: [StateType.UNKNOWN] },
      { id: 'and1', type: 'AND', inputStates: [StateType.UNKNOWN, StateType.UNKNOWN], outputStates: [StateType.UNKNOWN] },
      { id: 'led1', type: 'LED', inputStates: [StateType.UNKNOWN], outputStates: [] }
    ]

    const wires: WireState[] = [
      { id: 'wire1', state: StateType.UNKNOWN, sourceGateId: 'toggle1', sourcePortIndex: 0, targetGateId: 'and1', targetPortIndex: 0 },
      { id: 'wire2', state: StateType.UNKNOWN, sourceGateId: 'and1', sourcePortIndex: 0, targetGateId: 'led1', targetPortIndex: 0 }
    ]

    engine.initialize(gates, wires)
    const snapshot = engine.getSnapshot()

    expect(snapshot.gates).toHaveLength(3)
    expect(snapshot.wires).toHaveLength(2)
  })

  it('should propagate toggle switch output through circuit', () => {
    const gates: GateState[] = [
      { id: 'toggle1', type: 'TOGGLE', inputStates: [], outputStates: [StateType.ZERO] },
      { id: 'not1', type: 'NOT', inputStates: [StateType.UNKNOWN], outputStates: [StateType.UNKNOWN] },
      { id: 'led1', type: 'LED', inputStates: [StateType.UNKNOWN], outputStates: [] }
    ]

    const wires: WireState[] = [
      { id: 'wire1', state: StateType.UNKNOWN, sourceGateId: 'toggle1', sourcePortIndex: 0, targetGateId: 'not1', targetPortIndex: 0 },
      { id: 'wire2', state: StateType.UNKNOWN, sourceGateId: 'not1', sourcePortIndex: 0, targetGateId: 'led1', targetPortIndex: 0 }
    ]

    engine.initialize(gates, wires)

    // Run a few steps to propagate initial state
    engine.step(10)

    const snapshot1 = engine.getSnapshot()
    const notGate1 = snapshot1.gates.find(g => g.id === 'not1')
    // Toggle is ZERO, so NOT should output ONE
    expect(notGate1?.outputStates[0]).toBe(StateType.ONE)

    // Toggle the switch
    engine.toggleInput('toggle1')
    engine.step(10)

    const snapshot2 = engine.getSnapshot()
    const notGate2 = snapshot2.gates.find(g => g.id === 'not1')
    // Toggle is now ONE, so NOT should output ZERO
    expect(notGate2?.outputStates[0]).toBe(StateType.ZERO)
  })

  it('should handle AND gate logic correctly', () => {
    const gates: GateState[] = [
      { id: 'toggle1', type: 'TOGGLE', inputStates: [], outputStates: [StateType.ZERO] },
      { id: 'toggle2', type: 'TOGGLE', inputStates: [], outputStates: [StateType.ZERO] },
      { id: 'and1', type: 'AND', inputStates: [StateType.UNKNOWN, StateType.UNKNOWN], outputStates: [StateType.UNKNOWN] }
    ]

    const wires: WireState[] = [
      { id: 'wire1', state: StateType.UNKNOWN, sourceGateId: 'toggle1', sourcePortIndex: 0, targetGateId: 'and1', targetPortIndex: 0 },
      { id: 'wire2', state: StateType.UNKNOWN, sourceGateId: 'toggle2', sourcePortIndex: 0, targetGateId: 'and1', targetPortIndex: 1 }
    ]

    engine.initialize(gates, wires)
    engine.step(10)

    // Both inputs ZERO -> output ZERO
    let snapshot = engine.getSnapshot()
    let andGate = snapshot.gates.find(g => g.id === 'and1')
    expect(andGate?.outputStates[0]).toBe(StateType.ZERO)

    // Set first toggle to ONE
    engine.toggleInput('toggle1')
    engine.step(10)

    snapshot = engine.getSnapshot()
    andGate = snapshot.gates.find(g => g.id === 'and1')
    // ONE AND ZERO = ZERO
    expect(andGate?.outputStates[0]).toBe(StateType.ZERO)

    // Set second toggle to ONE
    engine.toggleInput('toggle2')
    engine.step(10)

    snapshot = engine.getSnapshot()
    andGate = snapshot.gates.find(g => g.id === 'and1')
    // ONE AND ONE = ONE
    expect(andGate?.outputStates[0]).toBe(StateType.ONE)
  })

  it('should reset simulation', () => {
    const gates: GateState[] = [
      { id: 'toggle1', type: 'TOGGLE', inputStates: [], outputStates: [StateType.ZERO] }
    ]

    engine.initialize(gates, [])
    engine.toggleInput('toggle1')
    engine.step(5)

    const timeBefore = engine.getCurrentTime()
    expect(timeBefore).toBeGreaterThan(0)

    engine.reset()

    expect(engine.getCurrentTime()).toBe(0)
  })

  it('should add and remove gates dynamically', () => {
    engine.initialize([], [])

    engine.addGate({
      id: 'newGate',
      type: 'NOT',
      inputStates: [StateType.UNKNOWN],
      outputStates: [StateType.UNKNOWN]
    })

    let snapshot = engine.getSnapshot()
    expect(snapshot.gates).toHaveLength(1)

    engine.removeGate('newGate')

    snapshot = engine.getSnapshot()
    expect(snapshot.gates).toHaveLength(0)
  })

  it('should track running state', () => {
    expect(engine.isRunning()).toBe(false)

    engine.run()
    expect(engine.isRunning()).toBe(true)

    engine.pause()
    expect(engine.isRunning()).toBe(false)
  })
})
