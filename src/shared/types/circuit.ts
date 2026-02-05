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

export interface CircuitData {
  version: string
  gates: GateData[]
  wires: WireData[]
}
