export interface Position {
  x: number
  y: number
}

export interface PortConnection {
  gateId: string
  portIndex: number
}

export interface GateData {
  id: string
  type: string
  position: Position
  inputs: PortConnection[]
  outputs: PortConnection[]
  params: Record<string, string>
}

export interface WireData {
  id: string
  sourceGateId: string
  sourcePortIndex: number
  targetGateId: string
  targetPortIndex: number
  points: Position[]
}

export interface LabelConnectorData {
  id: string
  label: string
  isOutput: boolean
  position: Position
  connectedGateId: string
  connectedPortIndex: number
}

export interface CircuitData {
  format?: 'metalogic'
  version: string
  gates: GateData[]
  wires: WireData[]
  labelConnectors?: LabelConnectorData[]
}

export interface ParseWarning {
  type:
    | 'unsupported_gate'
    | 'approximate_mapping'
    | 'missing_connection'
    | 'label_conflict'
    | 'import_info'
  gateId?: string
  gateType?: string
  message: string
}

export interface ParseResult {
  circuit: CircuitData
  warnings: ParseWarning[]
}
