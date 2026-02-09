import type {
  CircuitData,
  GateData,
  WireData,
  LabelConnectorData,
  ParseWarning,
  ParseResult
} from '@shared/types/circuit'

// ─── Internal params that should be stripped on save ─────────────────────────

const INTERNAL_PARAM_PREFIXES = ['_']

function cleanParams(params: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (!INTERNAL_PARAM_PREFIXES.some((p) => k.startsWith(p))) {
      clean[k] = v
    }
  }
  return clean
}

// ─── Serialization ──────────────────────────────────────────────────────────

export function serializeToMlc(circuit: CircuitData): string {
  const output = {
    format: 'metalogic' as const,
    version: circuit.version || '1.0.0',
    gates: circuit.gates.map((gate) => ({
      id: gate.id,
      type: gate.type,
      position: gate.position,
      params: cleanParams(gate.params)
    })),
    wires: circuit.wires.map((wire) => ({
      id: wire.id,
      sourceGateId: wire.sourceGateId,
      sourcePortIndex: wire.sourcePortIndex,
      targetGateId: wire.targetGateId,
      targetPortIndex: wire.targetPortIndex,
      points: wire.points
    })),
    labelConnectors: circuit.labelConnectors ?? []
  }

  return JSON.stringify(output, null, 2)
}

// ─── Deserialization ────────────────────────────────────────────────────────

interface MlcFile {
  format?: string
  version?: string
  gates?: MlcGate[]
  wires?: MlcWire[]
  labelConnectors?: MlcLabelConnector[]
}

interface MlcGate {
  id?: string
  type?: string
  position?: { x?: number; y?: number }
  params?: Record<string, string>
}

interface MlcWire {
  id?: string
  sourceGateId?: string
  sourcePortIndex?: number
  targetGateId?: string
  targetPortIndex?: number
  points?: { x?: number; y?: number }[]
}

interface MlcLabelConnector {
  id?: string
  label?: string
  isOutput?: boolean
  position?: { x?: number; y?: number }
  connectedGateId?: string
  connectedPortIndex?: number
}

export function parseMlcFile(content: string): ParseResult {
  const warnings: ParseWarning[] = []

  let raw: MlcFile
  try {
    raw = JSON.parse(content) as MlcFile
  } catch {
    throw new Error('Invalid MLC file: not valid JSON')
  }

  if (raw.format && raw.format !== 'metalogic') {
    warnings.push({
      type: 'import_info',
      message: `Unknown format "${raw.format}", attempting to parse as MetaLogic`
    })
  }

  const gates: GateData[] = []
  if (Array.isArray(raw.gates)) {
    for (const g of raw.gates) {
      if (!g.id || !g.type) continue
      gates.push({
        id: g.id,
        type: g.type,
        position: { x: g.position?.x ?? 0, y: g.position?.y ?? 0 },
        inputs: [],
        outputs: [],
        params: g.params ?? {}
      })
    }
  }

  const wires: WireData[] = []
  if (Array.isArray(raw.wires)) {
    for (const w of raw.wires) {
      if (!w.id || !w.sourceGateId || !w.targetGateId) continue
      wires.push({
        id: w.id,
        sourceGateId: w.sourceGateId,
        sourcePortIndex: w.sourcePortIndex ?? 0,
        targetGateId: w.targetGateId,
        targetPortIndex: w.targetPortIndex ?? 0,
        points: (w.points ?? []).map((p) => ({ x: p.x ?? 0, y: p.y ?? 0 }))
      })
    }
  }

  const labelConnectors: LabelConnectorData[] = []
  if (Array.isArray(raw.labelConnectors)) {
    for (const lc of raw.labelConnectors) {
      if (!lc.id || !lc.label || !lc.connectedGateId) continue
      labelConnectors.push({
        id: lc.id,
        label: lc.label,
        isOutput: lc.isOutput ?? true,
        position: { x: lc.position?.x ?? 0, y: lc.position?.y ?? 0 },
        connectedGateId: lc.connectedGateId,
        connectedPortIndex: lc.connectedPortIndex ?? 0
      })
    }
  }

  return {
    circuit: {
      format: 'metalogic',
      version: raw.version || '1.0.0',
      gates,
      wires,
      labelConnectors: labelConnectors.length > 0 ? labelConnectors : undefined
    },
    warnings
  }
}
