import { StateType, type IDType, type TimeType } from '../types/state'
import { Gate, type GateEvaluationResult } from './Gate'

/**
 * D Flip-Flop - captures data on clock edge
 * Inputs: 0=D (data), 1=CLK (clock)
 * Outputs: 0=Q, 1=Q' (inverted)
 */
export class DFlipFlop extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'D_FLIPFLOP', inputCount: 2, outputCount: 2, delay })
    this.internalState = { q: StateType.ZERO }
  }

  evaluate(): GateEvaluationResult {
    // Check for rising edge on clock (input 1)
    if (this.isRisingEdge(1)) {
      const d = this.inputs[0]?.state ?? StateType.UNKNOWN

      // Only capture valid states
      if (d === StateType.ZERO || d === StateType.ONE) {
        this.internalState['q'] = d
      } else if (d === StateType.UNKNOWN || d === StateType.HI_Z) {
        this.internalState['q'] = StateType.UNKNOWN
      }
      // CONFLICT stays as CONFLICT
      else if (d === StateType.CONFLICT) {
        this.internalState['q'] = StateType.CONFLICT
      }
    }

    const q = this.internalState['q'] as StateType
    const qNot = this.invertState(q)

    this.setOutput(0, q)
    this.setOutput(1, qNot)

    return { outputs: [q, qNot], delay: this.delay }
  }

  private invertState(state: StateType): StateType {
    switch (state) {
      case StateType.ZERO:
        return StateType.ONE
      case StateType.ONE:
        return StateType.ZERO
      default:
        return state
    }
  }

  /**
   * Async preset (set Q=1)
   */
  preset(): void {
    this.internalState['q'] = StateType.ONE
  }

  /**
   * Async clear (set Q=0)
   */
  clear(): void {
    this.internalState['q'] = StateType.ZERO
  }

  protected override onReset(): void {
    this.internalState = { q: StateType.ZERO }
  }
}

/**
 * D Flip-Flop with async Set/Reset
 * Inputs: 0=D, 1=CLK, 2=SET (active low), 3=RESET (active low)
 * Outputs: 0=Q, 1=Q'
 */
export class DFlipFlopWithSetReset extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'D_FLIPFLOP_SR', inputCount: 4, outputCount: 2, delay })
    this.internalState = { q: StateType.ZERO }
  }

  evaluate(): GateEvaluationResult {
    const set = this.inputs[2]?.state ?? StateType.ONE // Active low
    const reset = this.inputs[3]?.state ?? StateType.ONE // Active low

    // Async set/reset have priority over clock
    if (set === StateType.ZERO && reset === StateType.ZERO) {
      // Both active - invalid state
      this.internalState['q'] = StateType.CONFLICT
    } else if (set === StateType.ZERO) {
      this.internalState['q'] = StateType.ONE
    } else if (reset === StateType.ZERO) {
      this.internalState['q'] = StateType.ZERO
    } else if (this.isRisingEdge(1)) {
      // Normal clocked operation
      const d = this.inputs[0]?.state ?? StateType.UNKNOWN
      if (d === StateType.ZERO || d === StateType.ONE) {
        this.internalState['q'] = d
      } else {
        this.internalState['q'] = StateType.UNKNOWN
      }
    }

    const q = this.internalState['q'] as StateType
    const qNot = this.invertState(q)

    this.setOutput(0, q)
    this.setOutput(1, qNot)

    return { outputs: [q, qNot], delay: this.delay }
  }

  private invertState(state: StateType): StateType {
    switch (state) {
      case StateType.ZERO:
        return StateType.ONE
      case StateType.ONE:
        return StateType.ZERO
      default:
        return state
    }
  }

  protected override onReset(): void {
    this.internalState = { q: StateType.ZERO }
  }
}

/**
 * JK Flip-Flop - versatile flip-flop
 * Inputs: 0=J, 1=K, 2=CLK
 * Outputs: 0=Q, 1=Q'
 *
 * Truth table (on rising edge):
 * J K | Q+
 * 0 0 | Q  (hold)
 * 0 1 | 0  (reset)
 * 1 0 | 1  (set)
 * 1 1 | Q' (toggle)
 */
export class JKFlipFlop extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'JK_FLIPFLOP', inputCount: 3, outputCount: 2, delay })
    this.internalState = { q: StateType.ZERO }
  }

  evaluate(): GateEvaluationResult {
    // Check for rising edge on clock (input 2)
    if (this.isRisingEdge(2)) {
      const j = this.inputs[0]?.state ?? StateType.UNKNOWN
      const k = this.inputs[1]?.state ?? StateType.UNKNOWN
      const currentQ = this.internalState['q'] as StateType

      // Handle invalid inputs
      if (j === StateType.CONFLICT || k === StateType.CONFLICT) {
        this.internalState['q'] = StateType.CONFLICT
      } else if (
        j === StateType.UNKNOWN ||
        j === StateType.HI_Z ||
        k === StateType.UNKNOWN ||
        k === StateType.HI_Z
      ) {
        this.internalState['q'] = StateType.UNKNOWN
      } else {
        // Valid J and K values
        const jVal = j === StateType.ONE
        const kVal = k === StateType.ONE

        if (!jVal && !kVal) {
          // Hold - keep current state
        } else if (!jVal && kVal) {
          // Reset
          this.internalState['q'] = StateType.ZERO
        } else if (jVal && !kVal) {
          // Set
          this.internalState['q'] = StateType.ONE
        } else {
          // Toggle
          this.internalState['q'] = currentQ === StateType.ONE ? StateType.ZERO : StateType.ONE
        }
      }
    }

    const q = this.internalState['q'] as StateType
    const qNot = this.invertState(q)

    this.setOutput(0, q)
    this.setOutput(1, qNot)

    return { outputs: [q, qNot], delay: this.delay }
  }

  private invertState(state: StateType): StateType {
    switch (state) {
      case StateType.ZERO:
        return StateType.ONE
      case StateType.ONE:
        return StateType.ZERO
      default:
        return state
    }
  }

  protected override onReset(): void {
    this.internalState = { q: StateType.ZERO }
  }
}

/**
 * JK Flip-Flop with async Set/Reset
 * Inputs: 0=J, 1=K, 2=CLK, 3=SET (active low), 4=RESET (active low)
 * Outputs: 0=Q, 1=Q'
 */
export class JKFlipFlopWithSetReset extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'JK_FLIPFLOP_SR', inputCount: 5, outputCount: 2, delay })
    this.internalState = { q: StateType.ZERO }
  }

  evaluate(): GateEvaluationResult {
    const set = this.inputs[3]?.state ?? StateType.ONE // Active low
    const reset = this.inputs[4]?.state ?? StateType.ONE // Active low

    // Async set/reset have priority
    if (set === StateType.ZERO && reset === StateType.ZERO) {
      this.internalState['q'] = StateType.CONFLICT
    } else if (set === StateType.ZERO) {
      this.internalState['q'] = StateType.ONE
    } else if (reset === StateType.ZERO) {
      this.internalState['q'] = StateType.ZERO
    } else if (this.isRisingEdge(2)) {
      const j = this.inputs[0]?.state ?? StateType.UNKNOWN
      const k = this.inputs[1]?.state ?? StateType.UNKNOWN
      const currentQ = this.internalState['q'] as StateType

      if (j === StateType.CONFLICT || k === StateType.CONFLICT) {
        this.internalState['q'] = StateType.CONFLICT
      } else if (
        j === StateType.UNKNOWN ||
        j === StateType.HI_Z ||
        k === StateType.UNKNOWN ||
        k === StateType.HI_Z
      ) {
        this.internalState['q'] = StateType.UNKNOWN
      } else {
        const jVal = j === StateType.ONE
        const kVal = k === StateType.ONE

        if (!jVal && !kVal) {
          // Hold
        } else if (!jVal && kVal) {
          this.internalState['q'] = StateType.ZERO
        } else if (jVal && !kVal) {
          this.internalState['q'] = StateType.ONE
        } else {
          this.internalState['q'] = currentQ === StateType.ONE ? StateType.ZERO : StateType.ONE
        }
      }
    }

    const q = this.internalState['q'] as StateType
    const qNot = this.invertState(q)

    this.setOutput(0, q)
    this.setOutput(1, qNot)

    return { outputs: [q, qNot], delay: this.delay }
  }

  private invertState(state: StateType): StateType {
    switch (state) {
      case StateType.ZERO:
        return StateType.ONE
      case StateType.ONE:
        return StateType.ZERO
      default:
        return state
    }
  }

  protected override onReset(): void {
    this.internalState = { q: StateType.ZERO }
  }
}

/**
 * Factory for creating sequential gates
 */
export function createSequentialGate(type: string, id: IDType, delay: TimeType = 1): Gate {
  switch (type) {
    case 'D_FLIPFLOP':
      return new DFlipFlop(id, delay)
    case 'D_FLIPFLOP_SR':
      return new DFlipFlopWithSetReset(id, delay)
    case 'JK_FLIPFLOP':
      return new JKFlipFlop(id, delay)
    case 'JK_FLIPFLOP_SR':
      return new JKFlipFlopWithSetReset(id, delay)
    default:
      throw new Error(`Unknown sequential gate type: ${type}`)
  }
}
