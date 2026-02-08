import { StateType, type IDType, type TimeType } from '../types/state'
import { Gate, type GateEvaluationResult } from './Gate'

// Helper functions for 5-state logic
function logicalAnd(a: StateType, b: StateType): StateType {
  if (a === StateType.ZERO || b === StateType.ZERO) return StateType.ZERO
  if (a === StateType.CONFLICT || b === StateType.CONFLICT) return StateType.CONFLICT
  if (a === StateType.UNKNOWN || b === StateType.UNKNOWN) return StateType.UNKNOWN
  if (a === StateType.HI_Z || b === StateType.HI_Z) return StateType.UNKNOWN
  return StateType.ONE
}

function logicalOr(a: StateType, b: StateType): StateType {
  if (a === StateType.ONE || b === StateType.ONE) return StateType.ONE
  if (a === StateType.CONFLICT || b === StateType.CONFLICT) return StateType.CONFLICT
  if (a === StateType.UNKNOWN || b === StateType.UNKNOWN) return StateType.UNKNOWN
  if (a === StateType.HI_Z || b === StateType.HI_Z) return StateType.UNKNOWN
  return StateType.ZERO
}

function logicalXor(a: StateType, b: StateType): StateType {
  if (a === StateType.CONFLICT || b === StateType.CONFLICT) return StateType.CONFLICT
  if (a === StateType.UNKNOWN || b === StateType.UNKNOWN) return StateType.UNKNOWN
  if (a === StateType.HI_Z || b === StateType.HI_Z) return StateType.UNKNOWN
  return a === b ? StateType.ZERO : StateType.ONE
}

function isValid(s: StateType): boolean {
  return s === StateType.ZERO || s === StateType.ONE
}

function toNumber(s: StateType): number {
  return s === StateType.ONE ? 1 : 0
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

// ─── Multiplexers ───

export class Mux2to1Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'MUX_2TO1', inputCount: 3, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    const d0 = this.inputs[0]?.state ?? StateType.UNKNOWN
    const d1 = this.inputs[1]?.state ?? StateType.UNKNOWN
    const sel = this.inputs[2]?.state ?? StateType.UNKNOWN

    let y: StateType
    if (sel === StateType.ZERO) y = d0
    else if (sel === StateType.ONE) y = d1
    else y = StateType.UNKNOWN

    this.setOutput(0, y)
    return { outputs: [y], delay: this.delay }
  }
}

export class Mux4to1Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'MUX_4TO1', inputCount: 6, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = D0-D3, 4 = Sel0, 5 = Sel1
    const sel0 = this.inputs[4]?.state ?? StateType.UNKNOWN
    const sel1 = this.inputs[5]?.state ?? StateType.UNKNOWN
    const idx = bitsToIndex([sel0, sel1])

    let y: StateType
    if (idx >= 0 && idx < 4) {
      y = this.inputs[idx]?.state ?? StateType.UNKNOWN
    } else {
      y = StateType.UNKNOWN
    }

    this.setOutput(0, y)
    return { outputs: [y], delay: this.delay }
  }
}

export class Mux8to1Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'MUX_8TO1', inputCount: 11, outputCount: 1, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-7 = D0-D7, 8 = Sel0, 9 = Sel1, 10 = Sel2
    const sel0 = this.inputs[8]?.state ?? StateType.UNKNOWN
    const sel1 = this.inputs[9]?.state ?? StateType.UNKNOWN
    const sel2 = this.inputs[10]?.state ?? StateType.UNKNOWN
    const idx = bitsToIndex([sel0, sel1, sel2])

    let y: StateType
    if (idx >= 0 && idx < 8) {
      y = this.inputs[idx]?.state ?? StateType.UNKNOWN
    } else {
      y = StateType.UNKNOWN
    }

    this.setOutput(0, y)
    return { outputs: [y], delay: this.delay }
  }
}

// ─── Demultiplexers ───

export class Demux1to2Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'DEMUX_1TO2', inputCount: 2, outputCount: 2, delay })
  }

  evaluate(): GateEvaluationResult {
    const d = this.inputs[0]?.state ?? StateType.UNKNOWN
    const sel = this.inputs[1]?.state ?? StateType.UNKNOWN

    let y0: StateType = StateType.ZERO
    let y1: StateType = StateType.ZERO

    if (!isValid(sel)) {
      y0 = StateType.UNKNOWN
      y1 = StateType.UNKNOWN
    } else if (sel === StateType.ZERO) {
      y0 = d
    } else {
      y1 = d
    }

    this.setOutput(0, y0)
    this.setOutput(1, y1)
    return { outputs: [y0, y1], delay: this.delay }
  }
}

export class Demux1to4Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'DEMUX_1TO4', inputCount: 3, outputCount: 4, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0 = D, 1 = Sel0, 2 = Sel1
    const d = this.inputs[0]?.state ?? StateType.UNKNOWN
    const sel0 = this.inputs[1]?.state ?? StateType.UNKNOWN
    const sel1 = this.inputs[2]?.state ?? StateType.UNKNOWN
    const idx = bitsToIndex([sel0, sel1])

    const outputs: StateType[] = [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO]

    if (idx < 0) {
      outputs.fill(StateType.UNKNOWN)
    } else {
      outputs[idx] = d
    }

    for (let i = 0; i < 4; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

// ─── Decoders ───

export class Decoder2to4Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'DECODER_2TO4', inputCount: 3, outputCount: 4, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0 = A0, 1 = A1, 2 = EN
    const a0 = this.inputs[0]?.state ?? StateType.UNKNOWN
    const a1 = this.inputs[1]?.state ?? StateType.UNKNOWN
    const en = this.inputs[2]?.state ?? StateType.UNKNOWN

    const outputs: StateType[] = [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO]

    if (en === StateType.ONE) {
      const idx = bitsToIndex([a0, a1])
      if (idx >= 0) {
        outputs[idx] = StateType.ONE
      } else {
        outputs.fill(StateType.UNKNOWN)
      }
    } else if (!isValid(en)) {
      outputs.fill(StateType.UNKNOWN)
    }

    for (let i = 0; i < 4; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

export class Decoder3to8Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'DECODER_3TO8', inputCount: 4, outputCount: 8, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0 = A0, 1 = A1, 2 = A2, 3 = EN
    const a0 = this.inputs[0]?.state ?? StateType.UNKNOWN
    const a1 = this.inputs[1]?.state ?? StateType.UNKNOWN
    const a2 = this.inputs[2]?.state ?? StateType.UNKNOWN
    const en = this.inputs[3]?.state ?? StateType.UNKNOWN

    const outputs: StateType[] = Array(8).fill(StateType.ZERO)

    if (en === StateType.ONE) {
      const idx = bitsToIndex([a0, a1, a2])
      if (idx >= 0) {
        outputs[idx] = StateType.ONE
      } else {
        outputs.fill(StateType.UNKNOWN)
      }
    } else if (!isValid(en)) {
      outputs.fill(StateType.UNKNOWN)
    }

    for (let i = 0; i < 8; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

// ─── Priority Encoders ───

export class Encoder4to2Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'ENCODER_4TO2', inputCount: 4, outputCount: 3, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = D0-D3, Outputs: 0 = A0, 1 = A1, 2 = Valid
    // Priority: D3 highest
    let anyInvalid = false
    for (let i = 0; i < 4; i++) {
      if (!isValid(this.inputs[i]?.state ?? StateType.UNKNOWN)) {
        anyInvalid = true
        break
      }
    }

    if (anyInvalid) {
      const out = [StateType.UNKNOWN, StateType.UNKNOWN, StateType.UNKNOWN]
      for (let i = 0; i < 3; i++) this.setOutput(i, out[i]!)
      return { outputs: out, delay: this.delay }
    }

    let found = -1
    for (let i = 3; i >= 0; i--) {
      if (this.inputs[i]?.state === StateType.ONE) {
        found = i
        break
      }
    }

    const outputs: StateType[] = [StateType.ZERO, StateType.ZERO, StateType.ZERO]
    if (found >= 0) {
      outputs[0] = fromBool((found & 1) !== 0)
      outputs[1] = fromBool((found & 2) !== 0)
      outputs[2] = StateType.ONE // Valid
    }

    for (let i = 0; i < 3; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

export class Encoder8to3Gate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'ENCODER_8TO3', inputCount: 8, outputCount: 4, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-7 = D0-D7, Outputs: 0 = A0, 1 = A1, 2 = A2, 3 = Valid
    // Priority: D7 highest
    let anyInvalid = false
    for (let i = 0; i < 8; i++) {
      if (!isValid(this.inputs[i]?.state ?? StateType.UNKNOWN)) {
        anyInvalid = true
        break
      }
    }

    if (anyInvalid) {
      const out = [StateType.UNKNOWN, StateType.UNKNOWN, StateType.UNKNOWN, StateType.UNKNOWN]
      for (let i = 0; i < 4; i++) this.setOutput(i, out[i]!)
      return { outputs: out, delay: this.delay }
    }

    let found = -1
    for (let i = 7; i >= 0; i--) {
      if (this.inputs[i]?.state === StateType.ONE) {
        found = i
        break
      }
    }

    const outputs: StateType[] = [StateType.ZERO, StateType.ZERO, StateType.ZERO, StateType.ZERO]
    if (found >= 0) {
      outputs[0] = fromBool((found & 1) !== 0)
      outputs[1] = fromBool((found & 2) !== 0)
      outputs[2] = fromBool((found & 4) !== 0)
      outputs[3] = StateType.ONE // Valid
    }

    for (let i = 0; i < 4; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

// ─── Arithmetic ───

function fullAdderCompute(
  a: StateType,
  b: StateType,
  cin: StateType
): { sum: StateType; cout: StateType } {
  const sum = logicalXor(logicalXor(a, b), cin)
  const cout = logicalOr(logicalAnd(a, b), logicalAnd(cin, logicalXor(a, b)))
  return { sum, cout }
}

export class FullAdderGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'FULL_ADDER', inputCount: 3, outputCount: 2, delay })
  }

  evaluate(): GateEvaluationResult {
    const a = this.inputs[0]?.state ?? StateType.UNKNOWN
    const b = this.inputs[1]?.state ?? StateType.UNKNOWN
    const cin = this.inputs[2]?.state ?? StateType.UNKNOWN

    const { sum, cout } = fullAdderCompute(a, b, cin)

    this.setOutput(0, sum)
    this.setOutput(1, cout)
    return { outputs: [sum, cout], delay: this.delay }
  }
}

export class Adder4BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'ADDER_4BIT', inputCount: 9, outputCount: 6, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = A0-A3, 4-7 = B0-B3, 8 = Cin
    // Outputs: 0-3 = S0-S3, 4 = Cout, 5 = Overflow
    let carry = this.inputs[8]?.state ?? StateType.UNKNOWN
    const sums: StateType[] = []
    let carryIntoMSB = carry

    for (let i = 0; i < 4; i++) {
      const a = this.inputs[i]?.state ?? StateType.UNKNOWN
      const b = this.inputs[i + 4]?.state ?? StateType.UNKNOWN
      if (i === 3) carryIntoMSB = carry
      const result = fullAdderCompute(a, b, carry)
      sums.push(result.sum)
      carry = result.cout
    }

    // Overflow = Cin_to_MSB XOR Cout_from_MSB (signed overflow detection)
    const overflow = logicalXor(carryIntoMSB, carry)

    const outputs = [...sums, carry, overflow]
    for (let i = 0; i < 6; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

// ─── Comparators ───

export class Comparator1BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'COMPARATOR_1BIT', inputCount: 5, outputCount: 3, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0 = A, 1 = B, 2 = GT_in, 3 = EQ_in, 4 = LT_in
    // Outputs: 0 = GT, 1 = EQ, 2 = LT
    const a = this.inputs[0]?.state ?? StateType.UNKNOWN
    const b = this.inputs[1]?.state ?? StateType.UNKNOWN
    const gtIn = this.inputs[2]?.state ?? StateType.UNKNOWN
    const eqIn = this.inputs[3]?.state ?? StateType.UNKNOWN
    const ltIn = this.inputs[4]?.state ?? StateType.UNKNOWN

    let gt: StateType, eq: StateType, lt: StateType

    if (!isValid(a) || !isValid(b)) {
      gt = StateType.UNKNOWN
      eq = StateType.UNKNOWN
      lt = StateType.UNKNOWN
    } else if (a === StateType.ONE && b === StateType.ZERO) {
      gt = StateType.ONE
      eq = StateType.ZERO
      lt = StateType.ZERO
    } else if (a === StateType.ZERO && b === StateType.ONE) {
      gt = StateType.ZERO
      eq = StateType.ZERO
      lt = StateType.ONE
    } else {
      // A == B: pass through cascade inputs
      gt = gtIn
      eq = eqIn
      lt = ltIn
    }

    this.setOutput(0, gt)
    this.setOutput(1, eq)
    this.setOutput(2, lt)
    return { outputs: [gt, eq, lt], delay: this.delay }
  }
}

export class Comparator4BitGate extends Gate {
  constructor(id: IDType, delay: TimeType = 1) {
    super({ id, type: 'COMPARATOR_4BIT', inputCount: 11, outputCount: 3, delay })
  }

  evaluate(): GateEvaluationResult {
    // Inputs: 0-3 = A0-A3, 4-7 = B0-B3, 8 = GT_in, 9 = EQ_in, 10 = LT_in
    // Outputs: 0 = GT, 1 = EQ, 2 = LT
    const gtIn = this.inputs[8]?.state ?? StateType.UNKNOWN
    const eqIn = this.inputs[9]?.state ?? StateType.UNKNOWN
    const ltIn = this.inputs[10]?.state ?? StateType.UNKNOWN

    // Check all inputs valid
    for (let i = 0; i < 8; i++) {
      if (!isValid(this.inputs[i]?.state ?? StateType.UNKNOWN)) {
        const out = [StateType.UNKNOWN, StateType.UNKNOWN, StateType.UNKNOWN]
        for (let j = 0; j < 3; j++) this.setOutput(j, out[j]!)
        return { outputs: out, delay: this.delay }
      }
    }

    // Compare MSB to LSB (bit 3 down to bit 0)
    for (let i = 3; i >= 0; i--) {
      const a = toNumber(this.inputs[i]?.state ?? StateType.UNKNOWN)
      const b = toNumber(this.inputs[i + 4]?.state ?? StateType.UNKNOWN)
      if (a > b) {
        const out = [StateType.ONE, StateType.ZERO, StateType.ZERO]
        for (let j = 0; j < 3; j++) this.setOutput(j, out[j]!)
        return { outputs: out, delay: this.delay }
      } else if (a < b) {
        const out = [StateType.ZERO, StateType.ZERO, StateType.ONE]
        for (let j = 0; j < 3; j++) this.setOutput(j, out[j]!)
        return { outputs: out, delay: this.delay }
      }
    }

    // All equal: use cascade inputs
    const outputs = [gtIn, eqIn, ltIn]
    for (let i = 0; i < 3; i++) this.setOutput(i, outputs[i]!)
    return { outputs, delay: this.delay }
  }
}

// ─── Factory ───

export function createCombinationalGate(type: string, id: IDType, delay: TimeType = 1): Gate {
  switch (type) {
    case 'MUX_2TO1':
      return new Mux2to1Gate(id, delay)
    case 'MUX_4TO1':
      return new Mux4to1Gate(id, delay)
    case 'MUX_8TO1':
      return new Mux8to1Gate(id, delay)
    case 'DEMUX_1TO2':
      return new Demux1to2Gate(id, delay)
    case 'DEMUX_1TO4':
      return new Demux1to4Gate(id, delay)
    case 'DECODER_2TO4':
      return new Decoder2to4Gate(id, delay)
    case 'DECODER_3TO8':
      return new Decoder3to8Gate(id, delay)
    case 'ENCODER_4TO2':
      return new Encoder4to2Gate(id, delay)
    case 'ENCODER_8TO3':
      return new Encoder8to3Gate(id, delay)
    case 'FULL_ADDER':
      return new FullAdderGate(id, delay)
    case 'ADDER_4BIT':
      return new Adder4BitGate(id, delay)
    case 'COMPARATOR_1BIT':
      return new Comparator1BitGate(id, delay)
    case 'COMPARATOR_4BIT':
      return new Comparator4BitGate(id, delay)
    default:
      throw new Error(`Unknown combinational gate type: ${type}`)
  }
}
