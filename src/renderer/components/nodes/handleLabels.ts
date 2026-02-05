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
  LED: { inputs: ['Input'], outputs: [] }
}
