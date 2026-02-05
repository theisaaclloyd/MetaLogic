import { StateType, type IDType, type TimeType } from '../types/state'

export interface GatePort {
  state: StateType
  connectedWires: IDType[]
}

export interface GateConfig {
  id: IDType
  type: string
  inputCount: number
  outputCount: number
  delay?: TimeType
  params?: Record<string, unknown>
}

export interface GateEvaluationResult {
  outputs: StateType[]
  delay: TimeType
}

/**
 * Base class for all logic gates
 */
export abstract class Gate {
  readonly id: IDType
  readonly type: string
  readonly delay: TimeType
  readonly params: Record<string, unknown>

  protected inputs: GatePort[]
  protected outputs: GatePort[]
  protected internalState: Record<string, unknown> = {}

  // For edge detection
  protected previousInputs: StateType[] = []

  constructor(config: GateConfig) {
    this.id = config.id
    this.type = config.type
    this.delay = config.delay ?? 1
    this.params = config.params ?? {}

    this.inputs = Array.from({ length: config.inputCount }, () => ({
      state: StateType.UNKNOWN,
      connectedWires: []
    }))

    this.outputs = Array.from({ length: config.outputCount }, () => ({
      state: StateType.UNKNOWN,
      connectedWires: []
    }))

    this.previousInputs = this.inputs.map((p) => p.state)
  }

  /**
   * Get current input states
   */
  getInputStates(): StateType[] {
    return this.inputs.map((p) => p.state)
  }

  /**
   * Get current output states
   */
  getOutputStates(): StateType[] {
    return this.outputs.map((p) => p.state)
  }

  /**
   * Set input state at given index
   */
  setInput(index: number, state: StateType): void {
    if (index >= 0 && index < this.inputs.length) {
      this.inputs[index]!.state = state
    }
  }

  /**
   * Set output state at given index (used during evaluation)
   */
  protected setOutput(index: number, state: StateType): void {
    if (index >= 0 && index < this.outputs.length) {
      this.outputs[index]!.state = state
    }
  }

  /**
   * Get input port count
   */
  getInputCount(): number {
    return this.inputs.length
  }

  /**
   * Get output port count
   */
  getOutputCount(): number {
    return this.outputs.length
  }

  /**
   * Connect a wire to an input port
   */
  connectInputWire(portIndex: number, wireId: IDType): void {
    if (portIndex >= 0 && portIndex < this.inputs.length) {
      this.inputs[portIndex]!.connectedWires.push(wireId)
    }
  }

  /**
   * Connect a wire to an output port
   */
  connectOutputWire(portIndex: number, wireId: IDType): void {
    if (portIndex >= 0 && portIndex < this.outputs.length) {
      this.outputs[portIndex]!.connectedWires.push(wireId)
    }
  }

  /**
   * Disconnect a wire from input port
   */
  disconnectInputWire(portIndex: number, wireId: IDType): void {
    if (portIndex >= 0 && portIndex < this.inputs.length) {
      const wires = this.inputs[portIndex]!.connectedWires
      const idx = wires.indexOf(wireId)
      if (idx !== -1) wires.splice(idx, 1)
    }
  }

  /**
   * Disconnect a wire from output port
   */
  disconnectOutputWire(portIndex: number, wireId: IDType): void {
    if (portIndex >= 0 && portIndex < this.outputs.length) {
      const wires = this.outputs[portIndex]!.connectedWires
      const idx = wires.indexOf(wireId)
      if (idx !== -1) wires.splice(idx, 1)
    }
  }

  /**
   * Check for rising edge on input
   */
  protected isRisingEdge(inputIndex: number): boolean {
    const prev = this.previousInputs[inputIndex]
    const curr = this.inputs[inputIndex]?.state
    return prev === StateType.ZERO && curr === StateType.ONE
  }

  /**
   * Check for falling edge on input
   */
  protected isFallingEdge(inputIndex: number): boolean {
    const prev = this.previousInputs[inputIndex]
    const curr = this.inputs[inputIndex]?.state
    return prev === StateType.ONE && curr === StateType.ZERO
  }

  /**
   * Update previous inputs for edge detection
   */
  updatePreviousInputs(): void {
    this.previousInputs = this.inputs.map((p) => p.state)
  }

  /**
   * Get internal state (for serialization)
   */
  getInternalState(): Record<string, unknown> {
    return { ...this.internalState }
  }

  /**
   * Set internal state (for deserialization)
   */
  setInternalState(state: Record<string, unknown>): void {
    this.internalState = { ...state }
  }

  /**
   * Reset gate to initial state
   */
  reset(): void {
    for (const input of this.inputs) {
      input.state = StateType.UNKNOWN
    }
    for (const output of this.outputs) {
      output.state = StateType.UNKNOWN
    }
    this.previousInputs = this.inputs.map((p) => p.state)
    this.internalState = {}
    this.onReset()
  }

  /**
   * Override in subclasses for custom reset behavior
   */
  protected onReset(): void {
    // Default: no additional reset behavior
  }

  /**
   * Evaluate gate logic and return new output states.
   * Must be implemented by subclasses.
   */
  abstract evaluate(): GateEvaluationResult
}
