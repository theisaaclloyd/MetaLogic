import { StateType, type IDType, type TimeType } from '../types/state'
import { Gate, type GateConfig, type GateEvaluationResult } from './Gate'

// Helper function to compute logical AND with 5-state logic
function logicalAnd(a: StateType, b: StateType): StateType {
  if (a === StateType.ZERO || b === StateType.ZERO) return StateType.ZERO
  if (a === StateType.CONFLICT || b === StateType.CONFLICT) return StateType.CONFLICT
  if (a === StateType.UNKNOWN || b === StateType.UNKNOWN) return StateType.UNKNOWN
  if (a === StateType.HI_Z || b === StateType.HI_Z) return StateType.UNKNOWN
  return StateType.ONE
}

// Helper function to compute logical OR with 5-state logic
function logicalOr(a: StateType, b: StateType): StateType {
  if (a === StateType.ONE || b === StateType.ONE) return StateType.ONE
  if (a === StateType.CONFLICT || b === StateType.CONFLICT) return StateType.CONFLICT
  if (a === StateType.UNKNOWN || b === StateType.UNKNOWN) return StateType.UNKNOWN
  if (a === StateType.HI_Z || b === StateType.HI_Z) return StateType.UNKNOWN
  return StateType.ZERO
}

// Helper function to compute logical NOT with 5-state logic
function logicalNot(a: StateType): StateType {
  switch (a) {
    case StateType.ZERO:
      return StateType.ONE
    case StateType.ONE:
      return StateType.ZERO
    case StateType.HI_Z:
      return StateType.UNKNOWN
    case StateType.CONFLICT:
      return StateType.CONFLICT
    case StateType.UNKNOWN:
      return StateType.UNKNOWN
  }
}

// Helper function to compute logical XOR with 5-state logic
function logicalXor(a: StateType, b: StateType): StateType {
  if (a === StateType.CONFLICT || b === StateType.CONFLICT) return StateType.CONFLICT
  if (a === StateType.UNKNOWN || b === StateType.UNKNOWN) return StateType.UNKNOWN
  if (a === StateType.HI_Z || b === StateType.HI_Z) return StateType.UNKNOWN
  return a === b ? StateType.ZERO : StateType.ONE
}

/**
 * AND Gate - outputs ONE only if all inputs are ONE
 */
export class AndGate extends Gate {
  constructor(id: IDType, inputCount: number = 2, delay: TimeType = 1) {
    super({ id, type: 'AND', inputCount, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    let result = this.inputs[0]?.state ?? StateType.UNKNOWN
    for (let i = 1; i < this.inputs.length; i++) {
      result = logicalAnd(result, this.inputs[i]?.state ?? StateType.UNKNOWN)
    }
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * OR Gate - outputs ONE if any input is ONE
 */
export class OrGate extends Gate {
  constructor(id: IDType, inputCount: number = 2, delay: TimeType = 1) {
    super({ id, type: 'OR', inputCount, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    let result = this.inputs[0]?.state ?? StateType.UNKNOWN
    for (let i = 1; i < this.inputs.length; i++) {
      result = logicalOr(result, this.inputs[i]?.state ?? StateType.UNKNOWN)
    }
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * NOT Gate (Inverter) - outputs opposite of input
 */
export class NotGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'NOT', inputCount: 1, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    const input = this.inputs[0]?.state ?? StateType.UNKNOWN
    const result = logicalNot(input)
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * XOR Gate - outputs ONE if inputs are different
 */
export class XorGate extends Gate {
  constructor(id: IDType, inputCount: number = 2, delay: TimeType = 1) {
    super({ id, type: 'XOR', inputCount, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    let result = this.inputs[0]?.state ?? StateType.UNKNOWN
    for (let i = 1; i < this.inputs.length; i++) {
      result = logicalXor(result, this.inputs[i]?.state ?? StateType.UNKNOWN)
    }
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * NAND Gate - NOT AND
 */
export class NandGate extends Gate {
  constructor(id: IDType, inputCount: number = 2, delay: TimeType = 1) {
    super({ id, type: 'NAND', inputCount, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    let result = this.inputs[0]?.state ?? StateType.UNKNOWN
    for (let i = 1; i < this.inputs.length; i++) {
      result = logicalAnd(result, this.inputs[i]?.state ?? StateType.UNKNOWN)
    }
    result = logicalNot(result)
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * NOR Gate - NOT OR
 */
export class NorGate extends Gate {
  constructor(id: IDType, inputCount: number = 2, delay: TimeType = 1) {
    super({ id, type: 'NOR', inputCount, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    let result = this.inputs[0]?.state ?? StateType.UNKNOWN
    for (let i = 1; i < this.inputs.length; i++) {
      result = logicalOr(result, this.inputs[i]?.state ?? StateType.UNKNOWN)
    }
    result = logicalNot(result)
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * XNOR Gate - NOT XOR (equality)
 */
export class XnorGate extends Gate {
  constructor(id: IDType, inputCount: number = 2, delay: TimeType = 1) {
    super({ id, type: 'XNOR', inputCount, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    let result = this.inputs[0]?.state ?? StateType.UNKNOWN
    for (let i = 1; i < this.inputs.length; i++) {
      result = logicalXor(result, this.inputs[i]?.state ?? StateType.UNKNOWN)
    }
    result = logicalNot(result)
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * Buffer Gate - passes input to output (used for signal conditioning)
 */
export class BufferGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'BUFFER', inputCount: 1, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    const result = this.inputs[0]?.state ?? StateType.UNKNOWN
    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * Tri-state Buffer - controlled buffer that can output HI_Z
 * Input 0: Data
 * Input 1: Enable (active high)
 */
export class TriStateBufferGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'TRI_BUFFER', inputCount: 2, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    const data = this.inputs[0]?.state ?? StateType.UNKNOWN
    const enable = this.inputs[1]?.state ?? StateType.UNKNOWN

    let result: StateType
    if (enable === StateType.ONE) {
      result = data
    } else if (enable === StateType.ZERO) {
      result = StateType.HI_Z
    } else {
      result = StateType.UNKNOWN
    }

    this.setOutput(0, result)
    return { outputs: [result], delay: this.delay }
  }
}

/**
 * Toggle Switch - user-controlled input
 */
export class ToggleGate extends Gate {
  constructor(id: IDType) {
    super({ id, type: 'TOGGLE', inputCount: 0, outputCount: 1, delay: 0 })
    this.internalState = { value: StateType.ZERO }
  }

  evaluate(): GateEvaluationResult {
    const value = (this.internalState['value'] as StateType) ?? StateType.ZERO
    this.setOutput(0, value)
    return { outputs: [value], delay: 0 }
  }

  toggle(): void {
    const current = (this.internalState['value'] as StateType) ?? StateType.ZERO
    this.internalState['value'] = current === StateType.ZERO ? StateType.ONE : StateType.ZERO
  }

  setValue(value: StateType): void {
    this.internalState['value'] = value
  }

  protected override onReset(): void {
    this.internalState = { value: StateType.ZERO }
  }
}

/**
 * Clock Source - generates periodic pulses
 */
export class ClockGate extends Gate {
  private period: TimeType
  private highDuration: TimeType

  constructor(id: IDType, period: TimeType = 10, dutyCycle: number = 0.5) {
    super({ id, type: 'CLOCK', inputCount: 0, outputCount: 1, delay: 0 })
    this.period = period
    this.highDuration = Math.floor(period * dutyCycle)
    this.internalState = { phase: 0, value: StateType.ZERO }
  }

  evaluate(): GateEvaluationResult {
    const value = (this.internalState['value'] as StateType) ?? StateType.ZERO
    this.setOutput(0, value)
    return { outputs: [value], delay: 0 }
  }

  /**
   * Called by simulation engine to advance clock
   */
  tick(currentTime: TimeType): StateType {
    const phase = currentTime % this.period
    const newValue = phase < this.highDuration ? StateType.ONE : StateType.ZERO
    this.internalState['value'] = newValue
    this.internalState['phase'] = phase
    return newValue
  }

  getPeriod(): TimeType {
    return this.period
  }

  setPeriod(period: TimeType, dutyCycle: number = 0.5): void {
    this.period = period
    this.highDuration = Math.floor(period * dutyCycle)
  }

  protected override onReset(): void {
    this.internalState = { phase: 0, value: StateType.ZERO }
  }
}

/**
 * Pulse Button - generates a single pulse when activated
 */
export class PulseGate extends Gate {
  private pulseDuration: TimeType

  constructor(id: IDType, pulseDuration: TimeType = 1) {
    super({ id, type: 'PULSE', inputCount: 0, outputCount: 1, delay: 0 })
    this.pulseDuration = pulseDuration
    this.internalState = { active: false, endTime: 0 }
  }

  evaluate(): GateEvaluationResult {
    const active = this.internalState['active'] as boolean
    const value = active ? StateType.ONE : StateType.ZERO
    this.setOutput(0, value)
    return { outputs: [value], delay: 0 }
  }

  /**
   * Trigger a pulse starting at the given time
   */
  trigger(currentTime: TimeType): void {
    this.internalState['active'] = true
    this.internalState['endTime'] = currentTime + this.pulseDuration
  }

  /**
   * Check if pulse should end
   */
  checkPulseEnd(currentTime: TimeType): boolean {
    if (this.internalState['active'] && currentTime >= (this.internalState['endTime'] as number)) {
      this.internalState['active'] = false
      return true
    }
    return false
  }

  protected override onReset(): void {
    this.internalState = { active: false, endTime: 0 }
  }
}

/**
 * Display Gate - shows decimal value of binary inputs (1-digit or 2-digit)
 */
export class DisplayGate extends Gate {
  constructor(id: IDType, type: 'DISPLAY_1D' | 'DISPLAY_2D', bitWidth: number) {
    super({ id, type, inputCount: bitWidth, outputCount: 0, delay: 0 })
  }

  evaluate(): GateEvaluationResult {
    return { outputs: [], delay: 0 }
  }
}

/**
 * Keypad Gate - user-controlled 4-bit output via button grid
 */
export class KeypadGate extends Gate {
  constructor(id: IDType) {
    super({ id, type: 'KEYPAD', inputCount: 0, outputCount: 4, delay: 0 })
    this.internalState = { value: 0 }
  }

  evaluate(): GateEvaluationResult {
    const value = (this.internalState['value'] as number) ?? 0
    const outputs: StateType[] = []
    for (let i = 0; i < 4; i++) {
      outputs.push((value >> i) & 1 ? StateType.ONE : StateType.ZERO)
    }
    for (let i = 0; i < 4; i++) {
      this.setOutput(i, outputs[i]!)
    }
    return { outputs, delay: 0 }
  }

  setValue(value: number): void {
    this.internalState['value'] = Math.max(0, Math.min(15, value))
  }

  protected override onReset(): void {
    this.internalState = { value: 0 }
  }
}

/**
 * LED Output - displays state visually
 */
export class LedGate extends Gate {
  constructor(id: IDType) {
    super({ id, type: 'LED', inputCount: 1, outputCount: 0, delay: 0 })
  }

  evaluate(): GateEvaluationResult {
    // LED just reads input, no output
    return { outputs: [], delay: 0 }
  }

  getDisplayState(): StateType {
    return this.inputs[0]?.state ?? StateType.UNKNOWN
  }
}

/**
 * Factory function to create gates by type
 */
export function createGate(type: string, id: IDType, config?: GateConfig): Gate {
  switch (type) {
    case 'AND':
      return new AndGate(id, config?.inputCount ?? 2, config?.delay ?? 1)
    case 'OR':
      return new OrGate(id, config?.inputCount ?? 2, config?.delay ?? 1)
    case 'NOT':
      return new NotGate(id, config?.delay ?? 1)
    case 'XOR':
      return new XorGate(id, config?.inputCount ?? 2, config?.delay ?? 1)
    case 'NAND':
      return new NandGate(id, config?.inputCount ?? 2, config?.delay ?? 1)
    case 'NOR':
      return new NorGate(id, config?.inputCount ?? 2, config?.delay ?? 1)
    case 'XNOR':
      return new XnorGate(id, config?.inputCount ?? 2, config?.delay ?? 1)
    case 'BUFFER':
      return new BufferGate(id, config?.delay ?? 1)
    case 'TRI_BUFFER':
      return new TriStateBufferGate(id, config?.delay ?? 1)
    case 'TOGGLE':
      return new ToggleGate(id)
    case 'CLOCK':
      return new ClockGate(id, (config?.params?.['period'] as number) ?? 10)
    case 'PULSE':
      return new PulseGate(id, (config?.params?.['duration'] as number) ?? 1)
    case 'LED':
      return new LedGate(id)
    case 'DISPLAY_1D':
      return new DisplayGate(id, 'DISPLAY_1D', 4)
    case 'DISPLAY_2D':
      return new DisplayGate(id, 'DISPLAY_2D', 8)
    case 'KEYPAD':
      return new KeypadGate(id)
    default:
      throw new Error(`Unknown gate type: ${type}`)
  }
}
