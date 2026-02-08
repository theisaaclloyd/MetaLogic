import { StateType, type IDType, type TimeType } from '../types/state'
import { Gate, type GateConfig, type GateEvaluationResult } from './Gate'

function isValid(s: StateType): boolean {
  return s === StateType.ZERO || s === StateType.ONE
}

function fromBool(b: boolean): StateType {
  return b ? StateType.ONE : StateType.ZERO
}

/** Read bits from inputs and convert to unsigned integer. Returns -1 if any input is invalid. */
function bitsToIndex(inputs: StateType[]): number {
  for (const s of inputs) {
    if (!isValid(s)) return -1
  }
  let val = 0
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i] === StateType.ONE) val |= 1 << i
  }
  return val
}

// ─── Registers ───

export class Register4BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'REGISTER_4BIT', inputCount: 7, outputCount: 4, delay })
    this.internalState = {
      bits: [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO]
    }
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = D0-D3, 4 = CLK, 5 = CLR, 6 = LOAD
    const clr = this.inputs[5]?.state ?? StateType.UNKNOWN
    const load = this.inputs[6]?.state ?? StateType.UNKNOWN
    const bits = this.internalState['bits'] as StateType[]

    if (this.isRisingEdge(4)) {
      if (clr === StateType.ONE) {
        for (let i = 0; i < 4; i++) bits[i] = StateType.ZERO
      } else if (load === StateType.ONE) {
        for (let i = 0; i < 4; i++) {
          bits[i] = this.inputs[i]?.state ?? StateType.UNKNOWN
        }
      }
    }

    const outputs = bits.slice()
    for (let i = 0; i < 4; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }

  protected override onReset(): void {
    this.internalState = {
      bits: [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO]
    }
  }
}

export class Register8BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'REGISTER_8BIT', inputCount: 11, outputCount: 8, delay })
    this.internalState = {
      bits: Array(8).fill(StateType.ZERO)
    }
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-7 = D0-D7, 8 = CLK, 9 = CLR, 10 = LOAD
    const clr = this.inputs[9]?.state ?? StateType.UNKNOWN
    const load = this.inputs[10]?.state ?? StateType.UNKNOWN
    const bits = this.internalState['bits'] as StateType[]

    if (this.isRisingEdge(8)) {
      if (clr === StateType.ONE) {
        for (let i = 0; i < 8; i++) bits[i] = StateType.ZERO
      } else if (load === StateType.ONE) {
        for (let i = 0; i < 8; i++) {
          bits[i] = this.inputs[i]?.state ?? StateType.UNKNOWN
        }
      }
    }

    const outputs = bits.slice()
    for (let i = 0; i < 8; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }

  protected override onReset(): void {
    this.internalState = { bits: Array(8).fill(StateType.ZERO) }
  }
}

// ─── Shift Register ───

export class ShiftReg4BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'SHIFT_REG_4BIT', inputCount: 5, outputCount: 5, delay })
    this.internalState = {
      bits: [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO],
      serOut: StateType.ZERO
    }
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0 = SER_IN, 1 = CLK, 2 = CLR, 3 = SHIFT_EN, 4 = DIR
    // Outputs: 0-3 = Q0-Q3, 4 = SER_OUT
    const serIn = this.inputs[0]?.state ?? StateType.UNKNOWN
    const clr = this.inputs[2]?.state ?? StateType.UNKNOWN
    const shiftEn = this.inputs[3]?.state ?? StateType.UNKNOWN
    const dir = this.inputs[4]?.state ?? StateType.UNKNOWN
    const bits = this.internalState['bits'] as StateType[]
    let serOut = this.internalState['serOut'] as StateType

    if (this.isRisingEdge(1)) {
      if (clr === StateType.ONE) {
        for (let i = 0; i < 4; i++) bits[i] = StateType.ZERO
        serOut = StateType.ZERO
      } else if (shiftEn === StateType.ONE) {
        if (dir === StateType.ONE) {
          // Shift left: Q3←Q2←Q1←Q0←SER_IN, SER_OUT = old Q3
          serOut = bits[3]!
          for (let i = 3; i > 0; i--) bits[i] = bits[i - 1]!
          bits[0] = serIn
        } else if (dir === StateType.ZERO) {
          // Shift right: SER_IN→Q3→Q2→Q1→Q0, SER_OUT = old Q0
          serOut = bits[0]!
          for (let i = 0; i < 3; i++) bits[i] = bits[i + 1]!
          bits[3] = serIn
        }
      }
      this.internalState['serOut'] = serOut
    }

    const outputs = [...bits, serOut]
    for (let i = 0; i < 5; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }

  protected override onReset(): void {
    this.internalState = {
      bits: [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO],
      serOut: StateType.ZERO
    }
  }
}

// ─── Counter ───

export class Counter4BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'COUNTER_4BIT', inputCount: 9, outputCount: 5, delay })
    this.internalState = {
      bits: [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO],
      carry: StateType.ZERO
    }
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0 = CLK, 1 = CLR, 2 = EN, 3 = LOAD, 4 = UP_DOWN, 5-8 = D0-D3
    // Outputs: 0-3 = Q0-Q3, 4 = CARRY
    const clr = this.inputs[1]?.state ?? StateType.UNKNOWN
    const en = this.inputs[2]?.state ?? StateType.UNKNOWN
    const load = this.inputs[3]?.state ?? StateType.UNKNOWN
    const upDown = this.inputs[4]?.state ?? StateType.UNKNOWN
    const bits = this.internalState['bits'] as StateType[]
    let carry = StateType.ZERO

    if (this.isRisingEdge(0)) {
      if (clr === StateType.ONE) {
        for (let i = 0; i < 4; i++) bits[i] = StateType.ZERO
        carry = StateType.ZERO
      } else if (load === StateType.ONE) {
        for (let i = 0; i < 4; i++) {
          bits[i] = this.inputs[i + 5]?.state ?? StateType.UNKNOWN
        }
        carry = StateType.ZERO
      } else if (en === StateType.ONE) {
        // Convert bits to number
        let val = 0
        let allValid = true
        for (let i = 0; i < 4; i++) {
          if (!isValid(bits[i]!)) {
            allValid = false
            break
          }
          if (bits[i] === StateType.ONE) val |= 1 << i
        }

        if (allValid) {
          if (upDown === StateType.ONE) {
            // Count up
            val++
            carry = val > 15 ? StateType.ONE : StateType.ZERO
            val &= 0xf
          } else if (upDown === StateType.ZERO) {
            // Count down
            val--
            carry = val < 0 ? StateType.ONE : StateType.ZERO
            val = ((val % 16) + 16) % 16
          }

          for (let i = 0; i < 4; i++) {
            bits[i] = fromBool((val & (1 << i)) !== 0)
          }
        }
      }
      this.internalState['carry'] = carry
    }

    carry = this.internalState['carry'] as StateType
    const outputs = [...bits, carry]
    for (let i = 0; i < 5; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }

  protected override onReset(): void {
    this.internalState = {
      bits: [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO],
      carry: StateType.ZERO
    }
  }
}

// ─── RAM ───

class RamGate extends Gate {
  private dataWidth: number

  constructor(id: IDType, type: string, dataWidth: number, delay: TimeType = 1) {
    const inputCount = 4 + dataWidth + 2 // 4 addr + dataWidth DIN + WE + CLK
    super({ id, type, inputCount, outputCount: dataWidth, delay })
    this.dataWidth = dataWidth
    this.internalState = { memory: {} }
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = A0-A3, 4..(4+dataWidth-1) = DIN, (4+dataWidth) = WE, (4+dataWidth+1) = CLK
    const weIdx = 4 + this.dataWidth
    const clkIdx = weIdx + 1
    const we = this.inputs[weIdx]?.state ?? StateType.UNKNOWN
    const memory = this.internalState['memory'] as Record<string, StateType[]>

    // Address
    const addrBits: StateType[] = []
    for (let i = 0; i < 4; i++) addrBits.push(this.inputs[i]?.state ?? StateType.UNKNOWN)
    const addr = bitsToIndex(addrBits)

    // Write on rising clock edge when WE=1
    if (this.isRisingEdge(clkIdx) && we === StateType.ONE && addr >= 0) {
      const data: StateType[] = []
      for (let i = 0; i < this.dataWidth; i++) {
        data.push(this.inputs[4 + i]?.state ?? StateType.UNKNOWN)
      }
      memory[addr.toString()] = data
    }

    // Async read
    const outputs: StateType[] = []
    if (addr >= 0) {
      const stored = memory[addr.toString()]
      for (let i = 0; i < this.dataWidth; i++) {
        outputs.push(stored?.[i] ?? StateType.ZERO)
      }
    } else {
      for (let i = 0; i < this.dataWidth; i++) {
        outputs.push(StateType.UNKNOWN)
      }
    }

    for (let i = 0; i < this.dataWidth; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }

  protected override onReset(): void {
    this.internalState = { memory: {} }
  }
}

export class Ram16x4Gate extends RamGate {
  constructor(id: IDType, delay: TimeType = 1) {
    super(id, 'RAM_16X4', 4, delay)
  }
}

export class Ram16x8Gate extends RamGate {
  constructor(id: IDType, delay: TimeType = 1) {
    super(id, 'RAM_16X8', 8, delay)
  }
}

// ─── ROM ───

class RomGate extends Gate {
  private dataWidth: number

  constructor(id: IDType, type: string, dataWidth: number, config?: GateConfig) {
    super({ id, type, inputCount: 5, outputCount: dataWidth, delay: config?.delay ?? 1, params: config?.params })
    this.dataWidth = dataWidth
    // Initialize memory from params or empty
    const paramMemory = config?.params?.['memory'] as Record<string, StateType[]> | undefined
    this.internalState = { memory: paramMemory ?? {} }
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = A0-A3, 4 = EN
    // Outputs: 0..(dataWidth-1) = D0..D(n-1)
    const en = this.inputs[4]?.state ?? StateType.UNKNOWN
    const memory = this.internalState['memory'] as Record<string, StateType[]>

    const addrBits: StateType[] = []
    for (let i = 0; i < 4; i++) addrBits.push(this.inputs[i]?.state ?? StateType.UNKNOWN)
    const addr = bitsToIndex(addrBits)

    const outputs: StateType[] = []

    if (en === StateType.ONE && addr >= 0) {
      const stored = memory[addr.toString()]
      for (let i = 0; i < this.dataWidth; i++) {
        outputs.push(stored?.[i] ?? StateType.ZERO)
      }
    } else if (en === StateType.ZERO) {
      for (let i = 0; i < this.dataWidth; i++) {
        outputs.push(StateType.HI_Z)
      }
    } else {
      for (let i = 0; i < this.dataWidth; i++) {
        outputs.push(StateType.UNKNOWN)
      }
    }

    for (let i = 0; i < this.dataWidth; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }

  protected override onReset(): void {
    // ROM preserves its content on reset (it's read-only)
    const memory = this.internalState['memory']
    this.internalState = { memory: memory ?? {} }
  }
}

export class Rom16x4Gate extends RomGate {
  constructor(id: IDType, config?: GateConfig) {
    super(id, 'ROM_16X4', 4, config)
  }
}

export class Rom16x8Gate extends RomGate {
  constructor(id: IDType, config?: GateConfig) {
    super(id, 'ROM_16X8', 8, config)
  }
}

// ─── Factory ───

export function createMemoryGate(type: string, id: IDType, config?: GateConfig): Gate {
  switch (type) {
    case 'REGISTER_4BIT':
      return new Register4BitGate(id, config?.delay ?? 1)
    case 'REGISTER_8BIT':
      return new Register8BitGate(id, config?.delay ?? 1)
    case 'SHIFT_REG_4BIT':
      return new ShiftReg4BitGate(id, config?.delay ?? 1)
    case 'COUNTER_4BIT':
      return new Counter4BitGate(id, config?.delay ?? 1)
    case 'RAM_16X4':
      return new Ram16x4Gate(id, config?.delay ?? 1)
    case 'RAM_16X8':
      return new Ram16x8Gate(id, config?.delay ?? 1)
    case 'ROM_16X4':
      return new Rom16x4Gate(id, config)
    case 'ROM_16X8':
      return new Rom16x8Gate(id, config)
    default:
      throw new Error(`Unknown memory gate type: ${type}`)
  }
}
