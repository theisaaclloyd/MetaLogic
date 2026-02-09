// 5-state logic as per original CedarLogic
export enum StateType {
  ZERO = 0,
  ONE = 1,
  HI_Z = 2,
  CONFLICT = 3,
  UNKNOWN = 4
}

// Time types - using integers only for determinism
export type TimeType = number // bigint would be more accurate but number is fine for JS
export type IDType = string

export interface SimulationEvent {
  time: TimeType
  creationTime: TimeType // For deterministic ordering of events at same time
  gateId: IDType
  portIndex: number
  newState: StateType
}

export interface PortState {
  state: StateType
  connections: IDType[] // Wire IDs connected to this port
}

export interface GateState {
  id: IDType
  type: string
  inputStates: StateType[]
  outputStates: StateType[]
  internalState?: Record<string, unknown> // For flip-flops, etc.
}

export interface WireState {
  id: IDType
  state: StateType
  sourceGateId: IDType
  sourcePortIndex: number
  targetGateId: IDType
  targetPortIndex: number
}

export interface SimulationState {
  currentTime: TimeType
  gates: Map<IDType, GateState>
  wires: Map<IDType, WireState>
  running: boolean
  paused: boolean
}

// Messages between main thread and worker
export type WorkerMessage =
  | { type: 'init'; gates: GateState[]; wires: WireState[] }
  | { type: 'run' }
  | { type: 'pause' }
  | { type: 'step'; count?: number }
  | { type: 'reset' }
  | { type: 'toggle'; gateId: IDType }
  | { type: 'triggerPulse'; gateId: IDType }
  | { type: 'setInput'; gateId: IDType; value: StateType }
  | { type: 'addGate'; gate: GateState }
  | { type: 'removeGate'; gateId: IDType }
  | { type: 'addWire'; wire: WireState }
  | { type: 'removeWire'; wireId: IDType }
  | { type: 'getState' }
  | { type: 'setSpeed'; msPerTick: number }
  | { type: 'setKeypadValue'; gateId: IDType; value: number }
  | { type: 'setMemoryData'; gateId: IDType; memory: Record<string, number[]> }

export type WorkerResponse =
  | { type: 'stateUpdate'; gates: GateState[]; wires: WireState[]; time: TimeType }
  | { type: 'ready' }
  | { type: 'error'; message: string }
