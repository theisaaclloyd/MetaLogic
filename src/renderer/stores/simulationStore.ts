import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { TimeType, GateState, WireState } from '../simulation/types/state'

export type SimulationStatus = 'stopped' | 'running' | 'paused'

interface SimulationState {
  status: SimulationStatus
  currentTime: TimeType
  msPerTick: number // Milliseconds per simulation tick (1-1000)

  // Worker reference
  worker: Worker | null

  // Actions
  setStatus: (status: SimulationStatus) => void
  setCurrentTime: (time: TimeType) => void
  setMsPerTick: (msPerTick: number) => void

  run: () => void
  pause: () => void
  step: (count?: number) => void
  reset: () => void

  initializeSimulation: (gates: GateState[], wires: WireState[]) => void
  toggleInput: (gateId: string) => void
  triggerPulse: (gateId: string) => void
  setKeypadValue: (gateId: string, value: number) => void
  setMemoryData: (gateId: string, memory: Record<string, number[]>) => void

  setWorker: (worker: Worker | null) => void
}

export const useSimulationStore = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    status: 'stopped',
    currentTime: 0,
    msPerTick: 16,
    worker: null,

    setStatus: (status) => set({ status }),
    setCurrentTime: (time) => set({ currentTime: time }),
    setMsPerTick: (msPerTick) => {
      const clamped = Math.max(1, Math.min(1000, msPerTick))
      set({ msPerTick: clamped })
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'setSpeed', msPerTick: clamped })
      }
    },

    run: () => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'run' })
        set({ status: 'running' })
      }
    },

    pause: () => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'pause' })
        set({ status: 'paused' })
      }
    },

    step: (count = 1) => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'step', count })
      }
    },

    reset: () => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'reset' })
        set({ status: 'stopped', currentTime: 0 })
      }
    },

    initializeSimulation: (gates, wires) => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'init', gates, wires })
        set({ status: 'stopped', currentTime: 0 })
      }
    },

    toggleInput: (gateId) => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'toggle', gateId })
      }
    },

    triggerPulse: (gateId) => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'triggerPulse', gateId })
      }
    },

    setKeypadValue: (gateId, value) => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'setKeypadValue', gateId, value })
      }
    },

    setMemoryData: (gateId, memory) => {
      const { worker } = get()
      if (worker) {
        worker.postMessage({ type: 'setMemoryData', gateId, memory })
      }
    },

    setWorker: (worker) => set({ worker })
  }))
)
