import { parseStringPromise, Builder } from 'xml2js'
import type { CircuitData, GateData, WireData, Position } from '@shared/types/circuit'

interface CdlGate {
  ID: string[]
  type: string[]
  position?: string[]
  params?: Record<string, string[]>[]
}

interface CdlWire {
  ID: string[]
  shape?: string[]
  connections?: {
    from?: string[]
    to?: string[]
  }[]
}

interface CdlPage {
  PageViewport?: string[]
  gates?: { gate: CdlGate[] }[]
  wires?: { wire: CdlWire[] }[]
}

interface CdlDocument {
  circuit: {
    version?: string[]
    CurrentPage?: string[]
    [key: string]: CdlPage[] | string[] | undefined
  }
}

export async function parseCdlFile(xmlContent: string): Promise<CircuitData> {
  const result = (await parseStringPromise(xmlContent)) as CdlDocument

  if (!result.circuit) {
    throw new Error('Invalid CDL file: missing circuit element')
  }

  const circuit = result.circuit
  const gates: GateData[] = []
  const wires: WireData[] = []

  // Find page elements (they're named like "page 0", "page 1", etc.)
  const pageKeys = Object.keys(circuit).filter((key) => key.startsWith('page'))

  for (const pageKey of pageKeys) {
    const pages = circuit[pageKey] as CdlPage[] | undefined
    if (!pages || pages.length === 0) continue

    const page = pages[0]!

    // Parse gates
    if (page.gates?.[0]?.gate) {
      for (const gate of page.gates[0].gate) {
        const id = gate.ID?.[0] ?? ''
        const type = gate.type?.[0] ?? ''
        const position = parsePosition(gate.position?.[0])

        gates.push({
          id,
          type: mapGateType(type),
          position,
          inputs: [],
          outputs: [],
          params: parseParams(gate.params)
        })
      }
    }

    // Parse wires
    if (page.wires?.[0]?.wire) {
      for (const wire of page.wires[0].wire) {
        const id = wire.ID?.[0] ?? ''
        const connections = wire.connections?.[0]

        wires.push({
          id,
          sourceGateId: connections?.from?.[0] ?? '',
          sourcePortIndex: 0,
          targetGateId: connections?.to?.[0] ?? '',
          targetPortIndex: 0,
          points: parseWireShape(wire.shape?.[0])
        })
      }
    }
  }

  return {
    version: circuit.version?.[0] ?? '1.0.0',
    gates,
    wires
  }
}

function parsePosition(posStr?: string): Position {
  if (!posStr) return { x: 0, y: 0 }

  const parts = posStr.split(',').map((s) => parseFloat(s.trim()))
  return {
    x: parts[0] ?? 0,
    y: parts[1] ?? 0
  }
}

function parseWireShape(shapeStr?: string): Position[] {
  if (!shapeStr) return []

  const points: Position[] = []
  const coords = shapeStr.split(/[,\s]+/).filter((s) => s.length > 0)

  for (let i = 0; i < coords.length - 1; i += 2) {
    points.push({
      x: parseFloat(coords[i]!) || 0,
      y: parseFloat(coords[i + 1]!) || 0
    })
  }

  return points
}

function parseParams(params?: Record<string, string[]>[]): Record<string, string> {
  if (!params || params.length === 0) return {}

  const result: Record<string, string> = {}
  const param = params[0]!

  for (const [key, values] of Object.entries(param)) {
    if (values && values.length > 0) {
      result[key] = values[0]!
    }
  }

  return result
}

// Map original CedarLogic gate types to our types
function mapGateType(originalType: string): string {
  const typeMap: Record<string, string> = {
    AA_AND2: 'AND',
    AA_AND3: 'AND',
    AA_AND4: 'AND',
    AA_OR2: 'OR',
    AA_OR3: 'OR',
    AA_OR4: 'OR',
    AA_NOT: 'NOT',
    AA_XOR2: 'XOR',
    AA_NAND2: 'NAND',
    AA_NOR2: 'NOR',
    AA_XNOR2: 'XNOR',
    AA_BUF: 'BUFFER',
    AA_TRIBUF: 'TRI_BUFFER',
    TO_TOGGLE: 'TOGGLE',
    TO_CLOCK: 'CLOCK',
    TO_PULSE: 'PULSE',
    TO_LED: 'LED',
    AA_DFF: 'D_FLIPFLOP',
    AA_JKFF: 'JK_FLIPFLOP'
  }

  return typeMap[originalType] ?? originalType
}

export function serializeToCdl(circuit: CircuitData): string {
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  })

  const gatesXml = circuit.gates.map((gate) => ({
    ID: gate.id,
    type: reverseMapGateType(gate.type),
    position: `${gate.position.x},${gate.position.y}`,
    ...(Object.keys(gate.params).length > 0 ? { params: gate.params } : {})
  }))

  const wiresXml = circuit.wires.map((wire) => ({
    ID: wire.id,
    shape: wire.points.map((p) => `${p.x},${p.y}`).join(' '),
    connections: {
      from: wire.sourceGateId,
      to: wire.targetGateId
    }
  }))

  const obj = {
    circuit: {
      version: circuit.version,
      CurrentPage: '0',
      'page 0': {
        PageViewport: '0,0,1000,1000',
        gates: { gate: gatesXml },
        wires: { wire: wiresXml }
      }
    }
  }

  return builder.buildObject(obj)
}

function reverseMapGateType(type: string): string {
  const reverseMap: Record<string, string> = {
    AND: 'AA_AND2',
    OR: 'AA_OR2',
    NOT: 'AA_NOT',
    XOR: 'AA_XOR2',
    NAND: 'AA_NAND2',
    NOR: 'AA_NOR2',
    XNOR: 'AA_XNOR2',
    BUFFER: 'AA_BUF',
    TRI_BUFFER: 'AA_TRIBUF',
    TOGGLE: 'TO_TOGGLE',
    CLOCK: 'TO_CLOCK',
    PULSE: 'TO_PULSE',
    LED: 'TO_LED',
    D_FLIPFLOP: 'AA_DFF',
    JK_FLIPFLOP: 'AA_JKFF'
  }

  return reverseMap[type] ?? type
}
