import {
  StateType,
  type IDType,
  type TimeType,
  type GateState,
  type WireState
} from '../types/state'
import { EventQueue } from './EventQueue'
import { resolveWireState } from './WireResolver'
import { Gate } from '../gates/Gate'
import { createGate, ClockGate, PulseGate, ToggleGate } from '../gates/BasicGates'
import { createSequentialGate } from '../gates/SequentialGates'
import { createCombinationalGate } from '../gates/CombinationalGates'
import { createMemoryGate } from '../gates/MemoryGates'

export interface SimulationEngineConfig {
  maxEventsPerStep?: number
  maxTimePerStep?: TimeType
}

export interface StateUpdate {
  gateId: IDType
  portIndex: number
  oldState: StateType
  newState: StateType
}

export interface SimulationSnapshot {
  time: TimeType
  gates: GateState[]
  wires: WireState[]
}

/**
 * Core simulation engine implementing event-driven digital logic simulation.
 * Designed with a clean interface for future Rust/WASM migration.
 */
export class SimulationEngine {
  private gates: Map<IDType, Gate> = new Map()
  private wires: Map<
    IDType,
    {
      sourceGateId: IDType
      sourcePortIndex: number
      targetGateId: IDType
      targetPortIndex: number
      state: StateType
    }
  > = new Map()
  private eventQueue: EventQueue = new EventQueue()
  private currentTime: TimeType = 0
  private running = false
  private paused = false

  private config: Required<SimulationEngineConfig>
  private stateUpdateCallbacks: ((updates: StateUpdate[]) => void)[] = []
  private clockGates: ClockGate[] = []
  private pulseGates: PulseGate[] = []

  constructor(config: SimulationEngineConfig = {}) {
    this.config = {
      maxEventsPerStep: config.maxEventsPerStep ?? 10000,
      maxTimePerStep: config.maxTimePerStep ?? 1000
    }
  }

  /**
   * Initialize the simulation with gates and wires
   */
  initialize(gateStates: GateState[], wireStates: WireState[]): void {
    this.gates.clear()
    this.wires.clear()
    this.eventQueue.clear()
    this.currentTime = 0
    this.clockGates = []
    this.pulseGates = []

    // Create gate instances
    for (const gateState of gateStates) {
      const gate = this.createGateFromState(gateState)
      this.gates.set(gateState.id, gate)

      // Track clock and pulse gates
      if (gate instanceof ClockGate) {
        this.clockGates.push(gate)
      } else if (gate instanceof PulseGate) {
        this.pulseGates.push(gate)
      }
    }

    // Create wire connections
    for (const wireState of wireStates) {
      this.wires.set(wireState.id, {
        sourceGateId: wireState.sourceGateId,
        sourcePortIndex: wireState.sourcePortIndex,
        targetGateId: wireState.targetGateId,
        targetPortIndex: wireState.targetPortIndex,
        state: StateType.UNKNOWN
      })

      // Connect wire to gates
      const sourceGate = this.gates.get(wireState.sourceGateId)
      const targetGate = this.gates.get(wireState.targetGateId)

      if (sourceGate) {
        sourceGate.connectOutputWire(wireState.sourcePortIndex, wireState.id)
      }
      if (targetGate) {
        targetGate.connectInputWire(wireState.targetPortIndex, wireState.id)
      }
    }

    // Schedule initial evaluation for all gates
    for (const gate of this.gates.values()) {
      this.scheduleGateEvaluation(gate.id, 0)
    }
  }

  private createGateFromState(gateState: GateState): Gate {
    const sequentialTypes = ['D_FLIPFLOP', 'D_FLIPFLOP_SR', 'JK_FLIPFLOP', 'JK_FLIPFLOP_SR']
    const combinationalTypes = [
      'MUX_2TO1', 'MUX_4TO1', 'MUX_8TO1',
      'DEMUX_1TO2', 'DEMUX_1TO4',
      'DECODER_2TO4', 'DECODER_3TO8',
      'ENCODER_4TO2', 'ENCODER_8TO3',
      'FULL_ADDER', 'ADDER_4BIT',
      'COMPARATOR_1BIT', 'COMPARATOR_4BIT'
    ]
    const memoryTypes = [
      'REGISTER_4BIT', 'REGISTER_8BIT', 'SHIFT_REG_4BIT', 'COUNTER_4BIT',
      'RAM_16X4', 'RAM_16X8', 'ROM_16X4', 'ROM_16X8'
    ]

    let gate: Gate
    if (sequentialTypes.includes(gateState.type)) {
      gate = createSequentialGate(gateState.type, gateState.id)
    } else if (combinationalTypes.includes(gateState.type)) {
      gate = createCombinationalGate(gateState.type, gateState.id)
    } else if (memoryTypes.includes(gateState.type)) {
      gate = createMemoryGate(gateState.type, gateState.id, {
        id: gateState.id,
        type: gateState.type,
        inputCount: gateState.inputStates.length,
        outputCount: gateState.outputStates.length,
        params: gateState.internalState
      })
    } else {
      gate = createGate(gateState.type, gateState.id, {
        id: gateState.id,
        type: gateState.type,
        inputCount: gateState.inputStates.length || 2,
        outputCount: gateState.outputStates.length || 1,
        params: gateState.internalState
      })
    }

    // Restore internal state if provided
    if (gateState.internalState) {
      gate.setInternalState(gateState.internalState)
    }

    return gate
  }

  /**
   * Add a gate to the simulation
   */
  addGate(gateState: GateState): void {
    const gate = this.createGateFromState(gateState)
    this.gates.set(gateState.id, gate)

    if (gate instanceof ClockGate) {
      this.clockGates.push(gate)
    } else if (gate instanceof PulseGate) {
      this.pulseGates.push(gate)
    }

    this.scheduleGateEvaluation(gate.id, this.currentTime)
  }

  /**
   * Remove a gate from the simulation
   */
  removeGate(gateId: IDType): void {
    const gate = this.gates.get(gateId)
    if (!gate) return

    // Remove from clock/pulse tracking
    if (gate instanceof ClockGate) {
      const idx = this.clockGates.indexOf(gate)
      if (idx !== -1) this.clockGates.splice(idx, 1)
    } else if (gate instanceof PulseGate) {
      const idx = this.pulseGates.indexOf(gate)
      if (idx !== -1) this.pulseGates.splice(idx, 1)
    }

    // Remove connected wires
    const wiresToRemove: IDType[] = []
    for (const [wireId, wire] of this.wires) {
      if (wire.sourceGateId === gateId || wire.targetGateId === gateId) {
        wiresToRemove.push(wireId)
      }
    }
    for (const wireId of wiresToRemove) {
      this.removeWire(wireId)
    }

    this.eventQueue.removeEventsForGate(gateId)
    this.gates.delete(gateId)
  }

  /**
   * Add a wire to the simulation
   */
  addWire(wireState: WireState): void {
    this.wires.set(wireState.id, {
      sourceGateId: wireState.sourceGateId,
      sourcePortIndex: wireState.sourcePortIndex,
      targetGateId: wireState.targetGateId,
      targetPortIndex: wireState.targetPortIndex,
      state: StateType.UNKNOWN
    })

    const sourceGate = this.gates.get(wireState.sourceGateId)
    const targetGate = this.gates.get(wireState.targetGateId)

    if (sourceGate) {
      sourceGate.connectOutputWire(wireState.sourcePortIndex, wireState.id)
    }
    if (targetGate) {
      targetGate.connectInputWire(wireState.targetPortIndex, wireState.id)
    }

    // Propagate current source output to target
    if (sourceGate && targetGate) {
      const sourceOutputs = sourceGate.getOutputStates()
      const outputState = sourceOutputs[wireState.sourcePortIndex] ?? StateType.UNKNOWN
      this.propagateWireState(wireState.id, outputState)
    }
  }

  /**
   * Remove a wire from the simulation
   */
  removeWire(wireId: IDType): void {
    const wire = this.wires.get(wireId)
    if (!wire) return

    const sourceGate = this.gates.get(wire.sourceGateId)
    const targetGate = this.gates.get(wire.targetGateId)

    if (sourceGate) {
      sourceGate.disconnectOutputWire(wire.sourcePortIndex, wireId)
    }
    if (targetGate) {
      targetGate.disconnectInputWire(wire.targetPortIndex, wireId)
      // Re-evaluate target gate with disconnected input
      this.scheduleGateEvaluation(wire.targetGateId, this.currentTime + 1)
    }

    this.wires.delete(wireId)
  }

  /**
   * Toggle a toggle switch gate
   */
  toggleInput(gateId: IDType): void {
    const gate = this.gates.get(gateId)
    if (gate instanceof ToggleGate) {
      gate.toggle()
      this.scheduleGateEvaluation(gateId, this.currentTime)
    }
  }

  /**
   * Set an input gate's value directly
   */
  setInputValue(gateId: IDType, value: StateType): void {
    const gate = this.gates.get(gateId)
    if (gate instanceof ToggleGate) {
      gate.setValue(value)
      this.scheduleGateEvaluation(gateId, this.currentTime)
    }
  }

  /**
   * Trigger a pulse button
   */
  triggerPulse(gateId: IDType): void {
    const gate = this.gates.get(gateId)
    if (gate instanceof PulseGate) {
      gate.trigger(this.currentTime)
      this.scheduleGateEvaluation(gateId, this.currentTime)
    }
  }

  /**
   * Schedule a gate for evaluation at a specific time
   */
  private scheduleGateEvaluation(gateId: IDType, time: TimeType): void {
    this.eventQueue.push({
      time,
      gateId,
      portIndex: -1, // -1 indicates full gate evaluation
      newState: StateType.UNKNOWN
    })
  }

  /**
   * Propagate a wire state change to the target gate
   */
  private propagateWireState(wireId: IDType, newState: StateType): void {
    const wire = this.wires.get(wireId)
    if (!wire) return

    const oldState = wire.state
    if (oldState === newState) return

    wire.state = newState

    // Update target gate input
    const targetGate = this.gates.get(wire.targetGateId)
    if (targetGate) {
      // Resolve all inputs to this port (in case of multiple wires)
      const inputStates: StateType[] = []
      for (const [, w] of this.wires) {
        if (w.targetGateId === wire.targetGateId && w.targetPortIndex === wire.targetPortIndex) {
          inputStates.push(w.state)
        }
      }
      const resolvedState = resolveWireState(inputStates)
      targetGate.setInput(wire.targetPortIndex, resolvedState)

      // Schedule target gate evaluation
      this.scheduleGateEvaluation(wire.targetGateId, this.currentTime + 1)
    }
  }

  /**
   * Run a single simulation step (process events at current time)
   */
  step(count: number = 1): StateUpdate[] {
    const allUpdates: StateUpdate[] = []

    for (let i = 0; i < count; i++) {
      const updates = this.processTimeStep()
      allUpdates.push(...updates)

      if (this.eventQueue.isEmpty()) break
    }

    return allUpdates
  }

  /**
   * Process all events at the current time
   */
  private processTimeStep(): StateUpdate[] {
    const updates: StateUpdate[] = []
    let eventsProcessed = 0

    // Update clocks
    for (const clock of this.clockGates) {
      const oldState = clock.getOutputStates()[0] ?? StateType.UNKNOWN
      const newState = clock.tick(this.currentTime)
      if (oldState !== newState) {
        this.scheduleGateEvaluation(clock.id, this.currentTime)
      }
    }

    // Check pulse gates
    for (const pulse of this.pulseGates) {
      if (pulse.checkPulseEnd(this.currentTime)) {
        this.scheduleGateEvaluation(pulse.id, this.currentTime)
      }
    }

    // Process events at current time
    while (!this.eventQueue.isEmpty() && eventsProcessed < this.config.maxEventsPerStep) {
      const event = this.eventQueue.peek()
      if (!event || event.time > this.currentTime) break

      this.eventQueue.pop()
      eventsProcessed++

      const gate = this.gates.get(event.gateId)
      if (!gate) continue

      // Store previous outputs for edge detection
      const previousOutputs = gate.getOutputStates().slice()

      // Evaluate gate
      const result = gate.evaluate()

      // Update previous inputs for edge detection
      gate.updatePreviousInputs()

      // Check for output changes and propagate
      for (let i = 0; i < result.outputs.length; i++) {
        const oldState = previousOutputs[i] ?? StateType.UNKNOWN
        const newState = result.outputs[i] ?? StateType.UNKNOWN

        if (oldState !== newState) {
          updates.push({
            gateId: gate.id,
            portIndex: i,
            oldState,
            newState
          })

          // Propagate to connected wires
          for (const [wireId, wire] of this.wires) {
            if (wire.sourceGateId === gate.id && wire.sourcePortIndex === i) {
              this.propagateWireState(wireId, newState)
            }
          }
        }
      }
    }

    // Advance time
    const nextEvent = this.eventQueue.peek()
    if (nextEvent) {
      this.currentTime = Math.max(this.currentTime + 1, nextEvent.time)
    } else {
      this.currentTime++
    }

    return updates
  }

  /**
   * Run simulation continuously
   */
  run(): void {
    this.running = true
    this.paused = false
  }

  /**
   * Pause simulation
   */
  pause(): void {
    this.paused = true
  }

  /**
   * Resume simulation
   */
  resume(): void {
    this.paused = false
  }

  /**
   * Stop simulation
   */
  stop(): void {
    this.running = false
    this.paused = false
  }

  /**
   * Reset simulation to initial state
   */
  reset(): void {
    this.currentTime = 0
    this.eventQueue.clear()

    for (const gate of this.gates.values()) {
      gate.reset()
    }

    for (const wire of this.wires.values()) {
      wire.state = StateType.UNKNOWN
    }

    // Schedule initial evaluation
    for (const gate of this.gates.values()) {
      this.scheduleGateEvaluation(gate.id, 0)
    }
  }

  /**
   * Check if simulation is running
   */
  isRunning(): boolean {
    return this.running && !this.paused
  }

  /**
   * Check if simulation is paused
   */
  isPaused(): boolean {
    return this.paused
  }

  /**
   * Get current simulation time
   */
  getCurrentTime(): TimeType {
    return this.currentTime
  }

  /**
   * Get current state snapshot
   */
  getSnapshot(): SimulationSnapshot {
    const gateStates: GateState[] = []
    for (const [id, gate] of this.gates) {
      gateStates.push({
        id,
        type: gate.type,
        inputStates: gate.getInputStates(),
        outputStates: gate.getOutputStates(),
        internalState: gate.getInternalState()
      })
    }

    const wireStates: WireState[] = []
    for (const [id, wire] of this.wires) {
      wireStates.push({
        id,
        state: wire.state,
        sourceGateId: wire.sourceGateId,
        sourcePortIndex: wire.sourcePortIndex,
        targetGateId: wire.targetGateId,
        targetPortIndex: wire.targetPortIndex
      })
    }

    return {
      time: this.currentTime,
      gates: gateStates,
      wires: wireStates
    }
  }

  /**
   * Register callback for state updates
   */
  onStateUpdate(callback: (updates: StateUpdate[]) => void): () => void {
    this.stateUpdateCallbacks.push(callback)
    return () => {
      const idx = this.stateUpdateCallbacks.indexOf(callback)
      if (idx !== -1) this.stateUpdateCallbacks.splice(idx, 1)
    }
  }
}
