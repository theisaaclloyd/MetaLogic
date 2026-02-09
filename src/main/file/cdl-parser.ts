import { parseStringPromise, Builder } from 'xml2js'
import type {
  CircuitData,
  GateData,
  WireData,
  Position,
  ParseWarning,
  ParseResult
} from '@shared/types/circuit'

// ─── Gate Type Mapping ──────────────────────────────────────────────────────
// Maps CedarLogic gate types to MetaLogic types + hotspot ordering

interface GateMapping {
  type: string
  inputs: string[] // ordered hotspot names for inputs
  outputs: string[] // ordered hotspot names for outputs
}

const GATE_TYPE_MAP: Record<string, GateMapping> = {
  // Basic gates
  AA_AND2: { type: 'AND', inputs: ['IN_0', 'IN_1'], outputs: ['OUT'] },
  AA_AND3: { type: 'AND', inputs: ['IN_0', 'IN_1', 'IN_2'], outputs: ['OUT'] },
  AA_AND4: { type: 'AND', inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3'], outputs: ['OUT'] },
  AE_OR2: { type: 'OR', inputs: ['IN_0', 'IN_1'], outputs: ['OUT'] },
  AE_OR3: { type: 'OR', inputs: ['IN_0', 'IN_1', 'IN_2'], outputs: ['OUT'] },
  AE_OR4: { type: 'OR', inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3'], outputs: ['OUT'] },
  AI_XOR2: { type: 'XOR', inputs: ['IN_0', 'IN_1'], outputs: ['OUT'] },
  AO_XNOR2: { type: 'XNOR', inputs: ['IN_0', 'IN_1'], outputs: ['OUT'] },
  BA_NAND2: { type: 'NAND', inputs: ['IN_0', 'IN_1'], outputs: ['OUT'] },
  BA_NAND3: { type: 'NAND', inputs: ['IN_0', 'IN_1', 'IN_2'], outputs: ['OUT'] },
  BA_NAND4: { type: 'NAND', inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3'], outputs: ['OUT'] },
  BE_NOR2: { type: 'NOR', inputs: ['IN_0', 'IN_1'], outputs: ['OUT'] },
  BE_NOR3: { type: 'NOR', inputs: ['IN_0', 'IN_1', 'IN_2'], outputs: ['OUT'] },
  BE_NOR4: { type: 'NOR', inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3'], outputs: ['OUT'] },

  // Inverters / buffers
  AA_INVERTER: { type: 'NOT', inputs: ['IN_0'], outputs: ['OUT_0'] },
  AE_SMALL_INVERTER: { type: 'NOT', inputs: ['IN_0'], outputs: ['OUT_0'] },
  AA_NOT: { type: 'NOT', inputs: ['IN_0'], outputs: ['OUT_0'] },
  AA_BUF: { type: 'BUFFER', inputs: ['IN_0'], outputs: ['OUT_0'] },
  BA_TRI_STATE: { type: 'TRI_BUFFER', inputs: ['IN_0', 'ENABLE_0'], outputs: ['OUT_0'] },

  // I/O
  AA_TOGGLE: { type: 'TOGGLE', inputs: [], outputs: ['OUT_0'] },
  BB_CLOCK: { type: 'CLOCK', inputs: [], outputs: ['CLK'] },
  CC_PULSE: { type: 'PULSE', inputs: [], outputs: ['OUT_0'] },
  GA_LED: { type: 'LED', inputs: ['N_in0'], outputs: [] },

  // Multiplexers
  AI_MUX_2x1: { type: 'MUX_2TO1', inputs: ['IN_0', 'IN_1', 'SEL_0'], outputs: ['OUT_0'] },
  AI_MUX_4x1: {
    type: 'MUX_4TO1',
    inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3', 'SEL_0', 'SEL_1'],
    outputs: ['OUT_0']
  },
  AI_MUX_8x1: {
    type: 'MUX_8TO1',
    inputs: [
      'IN_0',
      'IN_1',
      'IN_2',
      'IN_3',
      'IN_4',
      'IN_5',
      'IN_6',
      'IN_7',
      'SEL_0',
      'SEL_1',
      'SEL_2'
    ],
    outputs: ['OUT_0']
  },

  // Decoders
  BE_DECODER_2x4: {
    type: 'DECODER_2TO4',
    inputs: ['IN_0', 'IN_1', 'ENABLE_0'],
    outputs: ['OUT_0', 'OUT_1', 'OUT_2', 'OUT_3']
  },
  BE_DECODER_3x8: {
    type: 'DECODER_3TO8',
    inputs: ['IN_0', 'IN_1', 'IN_2', 'ENABLE_0'],
    outputs: ['OUT_0', 'OUT_1', 'OUT_2', 'OUT_3', 'OUT_4', 'OUT_5', 'OUT_6', 'OUT_7']
  },

  // Encoders
  CC_PRI_ENCODER_4x2: {
    type: 'ENCODER_4TO2',
    inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3'],
    outputs: ['OUT_0', 'OUT_1', 'VALID']
  },
  CC_PRI_ENCODER_8x3: {
    type: 'ENCODER_8TO3',
    inputs: ['IN_0', 'IN_1', 'IN_2', 'IN_3', 'IN_4', 'IN_5', 'IN_6', 'IN_7'],
    outputs: ['OUT_0', 'OUT_1', 'OUT_2', 'VALID']
  },

  // Arithmetic
  AA_FULLADDER_1BIT: {
    type: 'FULL_ADDER',
    inputs: ['A_in', 'B_in', 'C_in'],
    outputs: ['SUM_out', 'CARRY_out']
  },

  // Flip-flops
  GI_DFF: { type: 'D_FLIPFLOP', inputs: ['IN_0', 'clock'], outputs: ['OUT_0', 'OUTINV_0'] },
  AE_DFF_LOW: { type: 'D_FLIPFLOP', inputs: ['IN_0', 'clock'], outputs: ['OUT_0', 'OUTINV_0'] },
  AE_DFF_LOW_NT: { type: 'D_FLIPFLOP', inputs: ['IN_0', 'clock'], outputs: ['OUT_0', 'OUTINV_0'] },
  AF_DFF_LOW: { type: 'D_FLIPFLOP', inputs: ['IN_0', 'clock'], outputs: ['OUT_0', 'OUTINV_0'] },
  GJ_JKFF: {
    type: 'JK_FLIPFLOP',
    inputs: ['J_in', 'clock', 'K_in'],
    outputs: ['OUT_0', 'OUTINV_0']
  },
  BE_JKFF_LOW: {
    type: 'JK_FLIPFLOP',
    inputs: ['J_in', 'clock', 'K_in'],
    outputs: ['OUT_0', 'OUTINV_0']
  },

  // Power
  EE_VDD: { type: 'TOGGLE', inputs: [], outputs: ['OUT_0'] },
  FF_GND: { type: 'TOGGLE', inputs: [], outputs: ['OUT_0'] }
}

// Virtual gates that are resolved and removed
const VIRTUAL_GATE_TYPES = new Set(['DA_FROM', 'DE_TO', 'HA_JUNC_2', 'HE_JUNC_4', 'AA_LABEL'])

// ─── Raw intermediate structures ────────────────────────────────────────────

interface RawPort {
  hotspotName: string
  wireIds: number[]
}

interface RawGate {
  id: number
  type: string
  position: Position
  inputs: RawPort[]
  outputs: RawPort[]
  gparams: Record<string, string>
  lparams: Record<string, string>
}

interface WireConnection {
  gateId: number
  hotspotName: string
}

interface RawWire {
  id: number
  connections: WireConnection[]
}

interface PortRef {
  gateId: number
  portIndex: number
  isOutput: boolean
}

// ─── Phase 1: Preamble Extraction ───────────────────────────────────────────

function extractCircuitBlock(content: string): { circuitXml: string; version: string } {
  // CedarLogic files have: <circuit>..preamble..</circuit><throw_away/><version>X.Y</version><circuit>..real data..</circuit>
  const throwAwayIdx = content.indexOf('<throw_away')
  if (throwAwayIdx === -1) {
    // MetaLogic-native file or simple CDL — use as-is
    return { circuitXml: content, version: '1.0.0' }
  }

  // Extract version between <version> tags
  let version = '1.0.0'
  const versionMatch = content.match(/<version>([\s\S]*?)<\/version>/)
  if (versionMatch) {
    version = versionMatch[1]!.trim()
  }

  // Find the real <circuit> block after <throw_away/>
  const afterThrowAway = content.substring(throwAwayIdx)
  const realCircuitMatch = afterThrowAway.match(/<circuit>([\s\S]*)$/)
  if (realCircuitMatch) {
    // Re-wrap it as a complete XML document
    return { circuitXml: `<circuit>${realCircuitMatch[1]!}`, version }
  }

  // Fallback: try using entire content
  return { circuitXml: content, version }
}

// ─── Phase 2: Tag Sanitization ──────────────────────────────────────────────

function sanitizeTags(xml: string): string {
  // Replace <page N> → <page_N> and </page N> → </page_N>
  return xml.replace(/<(\/?)page\s+(\d+)>/g, '<$1page_$2>')
}

// ─── Phase 3 & 4: Parse XML and Extract Raw Structures ─────────────────────

async function parseAndExtract(xml: string): Promise<{ rawGates: RawGate[]; rawWires: RawWire[] }> {
  const result = await parseStringPromise(xml, {
    explicitArray: true,
    preserveChildrenOrder: true,
    charsAsChildren: true
  })

  if (!result.circuit) {
    throw new Error('Invalid CDL file: missing circuit element')
  }

  const circuit = result.circuit
  const rawGates: RawGate[] = []
  const rawWires: RawWire[] = []

  // Find page elements (page_0, page_1, etc.)
  const pageKeys = Object.keys(circuit).filter((key) => key.startsWith('page'))

  for (let pageIndex = 0; pageIndex < pageKeys.length; pageIndex++) {
    const pageKey = pageKeys[pageIndex]!
    const pages = circuit[pageKey]
    if (!pages || !Array.isArray(pages) || pages.length === 0) continue

    const page = pages[0]
    const pageYOffset = pageIndex * 100 // offset in CDL coordinate units

    // Extract gates
    const gateElements = page.gate ?? []
    for (const gateEl of gateElements) {
      const gate = extractRawGate(gateEl, pageYOffset)
      if (gate) rawGates.push(gate)
    }

    // Extract wires
    const wireElements = page.wire ?? []
    for (const wireEl of wireElements) {
      const wire = extractRawWire(wireEl)
      if (wire) rawWires.push(wire)
    }
  }

  return { rawGates, rawWires }
}

function extractRawGate(gateEl: Record<string, unknown>, pageYOffset: number): RawGate | null {
  // Gate ID
  const idArr = gateEl.ID as string[] | undefined
  const id = parseInt(idArr?.[0] ?? '0')
  if (isNaN(id)) return null

  // Gate type
  const typeArr = gateEl.type as string[] | undefined
  const type = typeArr?.[0] ?? ''

  // Position
  const posArr = gateEl.position as string[] | undefined
  const pos = parsePosition(posArr?.[0])
  pos.y += pageYOffset

  // Parse inputs
  const inputs = extractPorts(gateEl.input as unknown[] | undefined)

  // Parse outputs
  const outputs = extractPorts(gateEl.output as unknown[] | undefined)

  // Parse gparams and lparams
  const gparams = extractParams(gateEl.gparam as string[] | undefined)
  const lparams = extractParams(gateEl.lparam as string[] | undefined)

  return { id, type, position: pos, inputs, outputs, gparams, lparams }
}

function extractPorts(portElements: unknown[] | undefined): RawPort[] {
  if (!portElements || !Array.isArray(portElements)) return []

  const ports: RawPort[] = []
  for (const portEl of portElements) {
    if (typeof portEl === 'string') continue
    const port = portEl as Record<string, unknown>

    // Hotspot name from <ID> child
    const idArr = port.ID as string[] | undefined
    const hotspotName = idArr?.[0]?.trim() ?? ''

    // Wire IDs: CedarLogic encodes them as text content after the <ID> tag
    // With explicitArray + charsAsChildren, text content appears as {_: "text"} entries or as direct text
    const wireIds: number[] = []

    // Try to get wire IDs from the _ (text) property
    const textContent = port._ as string | undefined
    if (textContent) {
      const ids = textContent
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0)
      wireIds.push(...ids)
    }

    if (hotspotName) {
      ports.push({ hotspotName, wireIds })
    }
  }

  return ports
}

function extractParams(paramElements: string[] | undefined): Record<string, string> {
  if (!paramElements || !Array.isArray(paramElements)) return {}

  const params: Record<string, string> = {}
  for (const paramStr of paramElements) {
    if (typeof paramStr !== 'string') continue
    const trimmed = paramStr.trim()
    const spaceIdx = trimmed.indexOf(' ')
    if (spaceIdx > 0) {
      params[trimmed.substring(0, spaceIdx)] = trimmed.substring(spaceIdx + 1)
    } else if (trimmed.length > 0) {
      params[trimmed] = ''
    }
  }
  return params
}

function extractRawWire(wireEl: Record<string, unknown>): RawWire | null {
  const idArr = wireEl.ID as string[] | undefined
  const id = parseInt(idArr?.[0] ?? '0')
  if (isNaN(id)) return null

  const connections: WireConnection[] = []

  // Wire can contain <shape> with <hsegment> and <vsegment> sub-elements
  // Connections are in <connection> elements within segments or directly on the wire
  const connectionElements = wireEl.connection as unknown[] | undefined
  if (connectionElements) {
    for (const connEl of connectionElements) {
      const conn = extractWireConnection(connEl)
      if (conn) connections.push(conn)
    }
  }

  // Also check within shape > segments
  const shapeArr = wireEl.shape as unknown[] | undefined
  if (shapeArr) {
    for (const shape of shapeArr) {
      if (typeof shape !== 'object' || shape === null) continue
      const shapeObj = shape as Record<string, unknown>

      for (const segType of ['hsegment', 'vsegment']) {
        const segments = shapeObj[segType] as unknown[] | undefined
        if (!segments) continue
        for (const seg of segments) {
          if (typeof seg !== 'object' || seg === null) continue
          const segObj = seg as Record<string, unknown>
          const segConns = segObj.connection as unknown[] | undefined
          if (!segConns) continue
          for (const connEl of segConns) {
            const conn = extractWireConnection(connEl)
            if (conn) connections.push(conn)
          }
        }
      }
    }
  }

  // Also look for segments directly on the wire element (no wrapping <shape>)
  for (const segType of ['hsegment', 'vsegment']) {
    const segments = wireEl[segType] as unknown[] | undefined
    if (!segments) continue
    for (const seg of segments) {
      if (typeof seg !== 'object' || seg === null) continue
      const segObj = seg as Record<string, unknown>
      const segConns = segObj.connection as unknown[] | undefined
      if (!segConns) continue
      for (const connEl of segConns) {
        const conn = extractWireConnection(connEl)
        if (conn) connections.push(conn)
      }
    }
  }

  return { id, connections }
}

function extractWireConnection(connEl: unknown): WireConnection | null {
  if (typeof connEl !== 'object' || connEl === null) return null
  const conn = connEl as Record<string, unknown>

  const gidArr = conn.GID as string[] | undefined
  const nameArr = conn.name as string[] | undefined

  const gateId = parseInt(gidArr?.[0] ?? '')
  const hotspotName = nameArr?.[0]?.trim() ?? ''

  if (isNaN(gateId) || !hotspotName) return null
  return { gateId, hotspotName }
}

// ─── Phase 5: Map, Resolve, Emit ────────────────────────────────────────────

const CDL_SCALE = 30

function transformPosition(cdlPos: Position, isCedarLogic: boolean): Position {
  if (!isCedarLogic) return cdlPos
  return {
    x: cdlPos.x * CDL_SCALE + 500,
    y: -(cdlPos.y * CDL_SCALE) + 500
  }
}

function resolveHotspotToPort(
  hotspotName: string,
  mapping: GateMapping,
  isOutput: boolean
): number {
  const list = isOutput ? mapping.outputs : mapping.inputs
  const idx = list.indexOf(hotspotName)
  if (idx >= 0) return idx

  // Fuzzy match: try case-insensitive
  const lowerName = hotspotName.toLowerCase()
  for (let i = 0; i < list.length; i++) {
    if (list[i]!.toLowerCase() === lowerName) return i
  }

  // Try matching by suffix (e.g., "in0" matches "IN_0")
  const numMatch = hotspotName.match(/(\d+)$/)
  if (numMatch) {
    const num = parseInt(numMatch[1]!)
    if (num < list.length) return num
  }

  return 0 // fallback to first port
}

export async function parseCdlFile(content: string): Promise<ParseResult> {
  const warnings: ParseWarning[] = []

  // Phase 1: Preamble extraction
  const { circuitXml, version } = extractCircuitBlock(content)
  const isCedarLogic = content.includes('<throw_away')

  // Phase 2: Tag sanitization
  const sanitized = sanitizeTags(circuitXml)

  // Phase 3 & 4: Parse XML and extract raw structures
  const { rawGates, rawWires } = await parseAndExtract(sanitized)

  // Build gate lookup by ID
  const gateById = new Map<number, RawGate>()
  for (const g of rawGates) gateById.set(g.id, g)

  // ── Resolve FROM/TO junctions ──

  // FROM gates: keyed by JUNCTION_ID label
  const fromByLabel = new Map<string, RawGate>()
  // TO gates: keyed by JUNCTION_ID label → list of gates
  const toByLabel = new Map<string, RawGate[]>()

  for (const gate of rawGates) {
    if (gate.type === 'DA_FROM') {
      const label = gate.lparams['JUNCTION_ID'] ?? gate.gparams['JUNCTION_ID'] ?? ''
      if (label) fromByLabel.set(label, gate)
    } else if (gate.type === 'DE_TO') {
      const label = gate.lparams['JUNCTION_ID'] ?? gate.gparams['JUNCTION_ID'] ?? ''
      if (label) {
        const list = toByLabel.get(label) ?? []
        list.push(gate)
        toByLabel.set(label, list)
      }
    }
  }

  // ── Build wireId → portRef map ──

  // For each gate input/output port, record which wireIds connect to it
  const wireToPortRefs = new Map<number, PortRef[]>()

  function addWirePortRef(wireId: number, ref: PortRef) {
    const list = wireToPortRefs.get(wireId) ?? []
    list.push(ref)
    wireToPortRefs.set(wireId, list)
  }

  // Process each non-virtual gate's ports
  for (const gate of rawGates) {
    if (VIRTUAL_GATE_TYPES.has(gate.type)) continue

    const mapping = GATE_TYPE_MAP[gate.type]
    if (!mapping) continue // will be warned later

    // Inputs
    for (const port of gate.inputs) {
      const portIndex = resolveHotspotToPort(port.hotspotName, mapping, false)
      for (const wireId of port.wireIds) {
        addWirePortRef(wireId, { gateId: gate.id, portIndex, isOutput: false })
      }
    }

    // Outputs
    for (const port of gate.outputs) {
      const portIndex = resolveHotspotToPort(port.hotspotName, mapping, true)
      for (const wireId of port.wireIds) {
        addWirePortRef(wireId, { gateId: gate.id, portIndex, isOutput: true })
      }
    }
  }

  // Also add port refs from virtual gates (FROM/TO/junctions) - their wireIds participate in the net
  for (const gate of rawGates) {
    if (!VIRTUAL_GATE_TYPES.has(gate.type)) continue
    if (gate.type === 'AA_LABEL') continue

    // All ports on virtual gates: collect wireIds for net merging
    const allPorts = [...gate.inputs, ...gate.outputs]
    for (const port of allPorts) {
      for (const wireId of port.wireIds) {
        // Mark them specially — we'll merge nets through these
        addWirePortRef(wireId, { gateId: gate.id, portIndex: 0, isOutput: gate.type === 'DA_FROM' })
      }
    }
  }

  // ── Supplement from wire elements ──

  for (const wire of rawWires) {
    for (const conn of wire.connections) {
      const gate = gateById.get(conn.gateId)
      if (!gate) continue

      if (VIRTUAL_GATE_TYPES.has(gate.type)) {
        // Virtual gate connection — add for net merging
        addWirePortRef(wire.id, {
          gateId: gate.id,
          portIndex: 0,
          isOutput: gate.type === 'DA_FROM'
        })
        continue
      }

      const mapping = GATE_TYPE_MAP[gate.type]
      if (!mapping) continue

      // Determine if this connection is an input or output by checking hotspot lists
      const isOutput = mapping.outputs.some(
        (h) => h.toLowerCase() === conn.hotspotName.toLowerCase()
      )
      const portIndex = resolveHotspotToPort(conn.hotspotName, mapping, isOutput)

      // Check if this exact ref already exists
      const existing = wireToPortRefs.get(wire.id) ?? []
      const alreadyExists = existing.some(
        (r) => r.gateId === conn.gateId && r.portIndex === portIndex && r.isOutput === isOutput
      )
      if (!alreadyExists) {
        addWirePortRef(wire.id, { gateId: conn.gateId, portIndex, isOutput })
      }
    }
  }

  // ── Resolve FROM/TO by merging wire nets ──

  // Use a union-find on wireIds
  const wireParent = new Map<number, number>()

  function findWire(w: number): number {
    if (!wireParent.has(w)) wireParent.set(w, w)
    let p = wireParent.get(w)!
    while (p !== wireParent.get(p)!) {
      wireParent.set(p, wireParent.get(wireParent.get(p)!)!)
      p = wireParent.get(p)!
    }
    return p
  }

  function unionWires(a: number, b: number) {
    const pa = findWire(a)
    const pb = findWire(b)
    if (pa !== pb) wireParent.set(pa, pb)
  }

  // Merge wire nets through FROM/TO labels
  for (const [label, fromGate] of fromByLabel) {
    const toGates = toByLabel.get(label) ?? []
    const fromWireIds = getAllWireIds(fromGate)
    const toWireIdSets = toGates.map(getAllWireIds)

    // Union all FROM wireIds together
    for (let i = 1; i < fromWireIds.length; i++) {
      unionWires(fromWireIds[0]!, fromWireIds[i]!)
    }

    // Union all TO wireIds with FROM wireIds
    for (const toWireIds of toWireIdSets) {
      for (const wid of toWireIds) {
        if (fromWireIds.length > 0) unionWires(fromWireIds[0]!, wid)
      }
    }
  }

  // Merge wire nets through junction gates
  for (const gate of rawGates) {
    if (gate.type !== 'HA_JUNC_2' && gate.type !== 'HE_JUNC_4') continue
    const juncWireIds = getAllWireIds(gate)
    for (let i = 1; i < juncWireIds.length; i++) {
      unionWires(juncWireIds[0]!, juncWireIds[i]!)
    }
  }

  // ── Rebuild merged wire→port map ──

  const mergedWireRefs = new Map<number, PortRef[]>()
  for (const [wireId, refs] of wireToPortRefs) {
    const root = findWire(wireId)
    const list = mergedWireRefs.get(root) ?? []
    for (const ref of refs) {
      // Skip refs belonging to virtual gates
      const gate = gateById.get(ref.gateId)
      if (gate && VIRTUAL_GATE_TYPES.has(gate.type)) continue
      // Deduplicate
      const exists = list.some(
        (r) =>
          r.gateId === ref.gateId && r.portIndex === ref.portIndex && r.isOutput === ref.isOutput
      )
      if (!exists) list.push(ref)
    }
    mergedWireRefs.set(root, list)
  }

  // ── Generate point-to-point wires ──

  const outputWires: WireData[] = []
  let wireCounter = 1

  for (const [, refs] of mergedWireRefs) {
    const outputs = refs.filter((r) => r.isOutput)
    const inputs = refs.filter((r) => !r.isOutput)

    if (outputs.length === 0 || inputs.length === 0) continue

    const source = outputs[0]!
    if (outputs.length > 1) {
      warnings.push({
        type: 'missing_connection',
        message: `Wire net has ${outputs.length} output drivers; using first (gate ${source.gateId})`
      })
    }

    for (const target of inputs) {
      outputWires.push({
        id: `wire_${wireCounter++}`,
        sourceGateId: `gate_${source.gateId}`,
        sourcePortIndex: source.portIndex,
        targetGateId: `gate_${target.gateId}`,
        targetPortIndex: target.portIndex,
        points: []
      })
    }
  }

  // ── Generate output gates ──

  const outputGates: GateData[] = []

  for (const gate of rawGates) {
    if (VIRTUAL_GATE_TYPES.has(gate.type)) continue

    const mapping = GATE_TYPE_MAP[gate.type]
    if (!mapping) {
      warnings.push({
        type: 'unsupported_gate',
        gateId: String(gate.id),
        gateType: gate.type,
        message: `Unsupported gate type "${gate.type}" — skipped`
      })
      continue
    }

    const params: Record<string, string> = { ...gate.gparams, ...gate.lparams }

    // Encode port counts for variable-input gates
    params['_inputCount'] = String(mapping.inputs.length)
    params['_outputCount'] = String(mapping.outputs.length)

    // Special handling for VDD/GND: set forced state
    if (gate.type === 'EE_VDD') {
      params['_forcedState'] = '1'
    } else if (gate.type === 'FF_GND') {
      params['_forcedState'] = '0'
    }

    // Approximate mapping warnings
    if (['AE_DFF_LOW', 'AE_DFF_LOW_NT', 'AF_DFF_LOW', 'BE_JKFF_LOW'].includes(gate.type)) {
      warnings.push({
        type: 'approximate_mapping',
        gateId: String(gate.id),
        gateType: gate.type,
        message: `"${gate.type}" mapped to "${mapping.type}" — reset/set/clock-enable pins ignored`
      })
    }

    outputGates.push({
      id: `gate_${gate.id}`,
      type: mapping.type,
      position: transformPosition(gate.position, isCedarLogic),
      inputs: [],
      outputs: [],
      params
    })
  }

  return {
    circuit: {
      version,
      gates: outputGates,
      wires: outputWires
    },
    warnings
  }
}

function getAllWireIds(gate: RawGate): number[] {
  const ids: number[] = []
  for (const port of [...gate.inputs, ...gate.outputs]) {
    ids.push(...port.wireIds)
  }
  return ids
}

function parsePosition(posStr?: string): Position {
  if (!posStr) return { x: 0, y: 0 }

  const parts = posStr.split(',').map((s) => parseFloat(s.trim()))
  return {
    x: parts[0] ?? 0,
    y: parts[1] ?? 0
  }
}

// ─── Serialization (MetaLogic → CDL) ────────────────────────────────────────

export function serializeToCdl(circuit: CircuitData): string {
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  })

  const gatesXml = circuit.gates.map((gate) => {
    // Strip internal params from output
    const cleanParams: Record<string, string> = {}
    for (const [k, v] of Object.entries(gate.params)) {
      if (!k.startsWith('_')) cleanParams[k] = v
    }

    return {
      ID: gate.id,
      type: reverseMapGateType(gate.type),
      position: `${gate.position.x},${gate.position.y}`,
      ...(Object.keys(cleanParams).length > 0 ? { params: cleanParams } : {})
    }
  })

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
      page_0: {
        PageViewport: '0,0,1000,1000',
        gates: { gate: gatesXml },
        wires: { wire: wiresXml }
      }
    }
  }

  // Build with valid XML tag names, then restore CedarLogic's "page N" format
  const xml = builder.buildObject(obj)
  return xml.replace(/<(\/?)page_(\d+)>/g, '<$1page $2>')
}

function reverseMapGateType(type: string): string {
  const reverseMap: Record<string, string> = {
    AND: 'AA_AND2',
    OR: 'AE_OR2',
    NOT: 'AA_NOT',
    XOR: 'AI_XOR2',
    NAND: 'BA_NAND2',
    NOR: 'BE_NOR2',
    XNOR: 'AO_XNOR2',
    BUFFER: 'AA_BUF',
    TRI_BUFFER: 'BA_TRI_STATE',
    TOGGLE: 'AA_TOGGLE',
    CLOCK: 'BB_CLOCK',
    PULSE: 'CC_PULSE',
    LED: 'GA_LED',
    D_FLIPFLOP: 'GI_DFF',
    JK_FLIPFLOP: 'GJ_JKFF',
    MUX_2TO1: 'AI_MUX_2x1',
    MUX_4TO1: 'AI_MUX_4x1',
    MUX_8TO1: 'AI_MUX_8x1',
    DECODER_2TO4: 'BE_DECODER_2x4',
    DECODER_3TO8: 'BE_DECODER_3x8',
    ENCODER_4TO2: 'CC_PRI_ENCODER_4x2',
    ENCODER_8TO3: 'CC_PRI_ENCODER_8x3',
    FULL_ADDER: 'AA_FULLADDER_1BIT'
  }

  return reverseMap[type] ?? type
}
