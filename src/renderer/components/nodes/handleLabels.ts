export const HANDLE_LABELS: Record<string, { inputs: string[]; outputs: string[] }> = {
  AND: { inputs: ['Input 1', 'Input 2'], outputs: ['Output'] },
  OR: { inputs: ['Input 1', 'Input 2'], outputs: ['Output'] },
  XOR: { inputs: ['Input 1', 'Input 2'], outputs: ['Output'] },
  NAND: { inputs: ['Input 1', 'Input 2'], outputs: ['Output'] },
  NOR: { inputs: ['Input 1', 'Input 2'], outputs: ['Output'] },
  XNOR: { inputs: ['Input 1', 'Input 2'], outputs: ['Output'] },
  NOT: { inputs: ['Input'], outputs: ['Output'] },
  BUFFER: { inputs: ['Input'], outputs: ['Output'] },
  TRI_BUFFER: { inputs: ['Data', 'Enable'], outputs: ['Output'] },
  D_FLIPFLOP: { inputs: ['D', 'CLK'], outputs: ['Q', '/Q'] },
  JK_FLIPFLOP: { inputs: ['J', 'CLK', 'K'], outputs: ['Q', '/Q'] },
  TOGGLE: { inputs: [], outputs: ['Output'] },
  CLOCK: { inputs: [], outputs: ['CLK'] },
  PULSE: { inputs: [], outputs: ['Output'] },
  LED: { inputs: ['Input'], outputs: [] },
  // Multiplexers
  MUX_2TO1: { inputs: ['D0', 'D1', 'Sel'], outputs: ['Y'] },
  MUX_4TO1: { inputs: ['D0', 'D1', 'D2', 'D3', 'Sel0', 'Sel1'], outputs: ['Y'] },
  MUX_8TO1: {
    inputs: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'Sel0', 'Sel1', 'Sel2'],
    outputs: ['Y']
  },
  // Demultiplexers
  DEMUX_1TO2: { inputs: ['D', 'Sel'], outputs: ['Y0', 'Y1'] },
  DEMUX_1TO4: { inputs: ['D', 'Sel0', 'Sel1'], outputs: ['Y0', 'Y1', 'Y2', 'Y3'] },
  // Decoders
  DECODER_2TO4: { inputs: ['A0', 'A1', 'EN'], outputs: ['Y0', 'Y1', 'Y2', 'Y3'] },
  DECODER_3TO8: {
    inputs: ['A0', 'A1', 'A2', 'EN'],
    outputs: ['Y0', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6', 'Y7']
  },
  // Encoders
  ENCODER_4TO2: { inputs: ['D0', 'D1', 'D2', 'D3'], outputs: ['A0', 'A1', 'Valid'] },
  ENCODER_8TO3: {
    inputs: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
    outputs: ['A0', 'A1', 'A2', 'Valid']
  },
  // Arithmetic
  FULL_ADDER: { inputs: ['A', 'B', 'Cin'], outputs: ['Sum', 'Cout'] },
  ADDER_4BIT: {
    inputs: ['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B2', 'B3', 'Cin'],
    outputs: ['S0', 'S1', 'S2', 'S3', 'Cout', 'OVF']
  },
  // Comparators
  COMPARATOR_1BIT: { inputs: ['A', 'B', 'GT_in', 'EQ_in', 'LT_in'], outputs: ['GT', 'EQ', 'LT'] },
  COMPARATOR_4BIT: {
    inputs: ['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B2', 'B3', 'GT_in', 'EQ_in', 'LT_in'],
    outputs: ['GT', 'EQ', 'LT']
  },
  // Registers
  REGISTER_4BIT: {
    inputs: ['D0', 'D1', 'D2', 'D3', 'CLK', 'CLR', 'LOAD'],
    outputs: ['Q0', 'Q1', 'Q2', 'Q3']
  },
  REGISTER_8BIT: {
    inputs: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'CLK', 'CLR', 'LOAD'],
    outputs: ['Q0', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7']
  },
  SHIFT_REG_4BIT: {
    inputs: ['SER_IN', 'CLK', 'CLR', 'SHIFT', 'DIR'],
    outputs: ['Q0', 'Q1', 'Q2', 'Q3', 'SER_OUT']
  },
  COUNTER_4BIT: {
    inputs: ['CLK', 'CLR', 'EN', 'LOAD', 'UP/DN', 'D0', 'D1', 'D2', 'D3'],
    outputs: ['Q0', 'Q1', 'Q2', 'Q3', 'CARRY']
  },
  // Memory
  RAM_16X4: {
    inputs: ['A0', 'A1', 'A2', 'A3', 'DIN0', 'DIN1', 'DIN2', 'DIN3', 'WE', 'CLK'],
    outputs: ['DOUT0', 'DOUT1', 'DOUT2', 'DOUT3']
  },
  RAM_16X8: {
    inputs: [
      'A0', 'A1', 'A2', 'A3',
      'DIN0', 'DIN1', 'DIN2', 'DIN3', 'DIN4', 'DIN5', 'DIN6', 'DIN7',
      'WE', 'CLK'
    ],
    outputs: ['DOUT0', 'DOUT1', 'DOUT2', 'DOUT3', 'DOUT4', 'DOUT5', 'DOUT6', 'DOUT7']
  },
  ROM_16X4: {
    inputs: ['A0', 'A1', 'A2', 'A3', 'EN'],
    outputs: ['D0', 'D1', 'D2', 'D3']
  },
  ROM_16X8: {
    inputs: ['A0', 'A1', 'A2', 'A3', 'EN'],
    outputs: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
  }
}
