import { SimulationEngine } from '../simulation/core/SimulationEngine'
import type { WorkerMessage, WorkerResponse } from '../simulation/types/state'

let engine: SimulationEngine | null = null
let animFrameId: ReturnType<typeof setTimeout> | null = null

// Time-accumulator state
let msPerTick = 16
let accumulator = 0
let lastTime = 0

const FRAME_INTERVAL = 16 // ~60 FPS
const MAX_STEPS_PER_FRAME = 100

function sendResponse(response: WorkerResponse): void {
  self.postMessage(response)
}

function sendStateUpdate(): void {
  if (!engine) return

  const snapshot = engine.getSnapshot()
  sendResponse({
    type: 'stateUpdate',
    gates: snapshot.gates,
    wires: snapshot.wires,
    time: snapshot.time
  })
}

function simulationLoop(): void {
  if (!engine || !engine.isRunning()) {
    stopLoop()
    return
  }

  const now = performance.now()
  const dt = now - lastTime
  lastTime = now
  accumulator += dt

  let steps = Math.floor(accumulator / msPerTick)
  if (steps > MAX_STEPS_PER_FRAME) steps = MAX_STEPS_PER_FRAME
  accumulator -= steps * msPerTick
  // Prevent accumulator from growing unboundedly
  if (accumulator > msPerTick * MAX_STEPS_PER_FRAME) {
    accumulator = 0
  }

  if (steps > 0) {
    engine.step(steps)
    sendStateUpdate()
  }

  animFrameId = setTimeout(simulationLoop, FRAME_INTERVAL)
}

function startLoop(): void {
  if (!engine) return
  accumulator = 0
  lastTime = performance.now()

  if (!animFrameId) {
    animFrameId = setTimeout(simulationLoop, FRAME_INTERVAL)
  }
}

function stopLoop(): void {
  if (animFrameId) {
    clearTimeout(animFrameId)
    animFrameId = null
  }
}

function startSimulation(): void {
  if (!engine) return
  engine.run()
  startLoop()
}

function stopSimulation(): void {
  if (engine) {
    engine.pause()
  }
  stopLoop()
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data

  switch (message.type) {
    case 'init': {
      stopSimulation()
      engine = new SimulationEngine()
      engine.initialize(message.gates, message.wires)
      sendStateUpdate()
      sendResponse({ type: 'ready' })
      break
    }

    case 'run': {
      if (engine) {
        startSimulation()
      }
      break
    }

    case 'pause': {
      stopSimulation()
      sendStateUpdate()
      break
    }

    case 'step': {
      if (engine) {
        const count = message.count ?? 1
        engine.step(count)
        sendStateUpdate()
      }
      break
    }

    case 'reset': {
      stopSimulation()
      if (engine) {
        engine.reset()
        sendStateUpdate()
      }
      break
    }

    case 'toggle': {
      if (engine) {
        engine.toggleInput(message.gateId)
        // Process immediate update
        engine.step(1)
        sendStateUpdate()
      }
      break
    }

    case 'triggerPulse': {
      if (engine) {
        engine.triggerPulse(message.gateId)
        engine.step(1)
        sendStateUpdate()
      }
      break
    }

    case 'setInput': {
      if (engine) {
        engine.setInputValue(message.gateId, message.value)
        engine.step(1)
        sendStateUpdate()
      }
      break
    }

    case 'setSpeed': {
      msPerTick = Math.max(1, Math.min(1000, message.msPerTick))
      break
    }

    case 'addGate': {
      if (engine) {
        engine.addGate(message.gate)
        sendStateUpdate()
      }
      break
    }

    case 'removeGate': {
      if (engine) {
        engine.removeGate(message.gateId)
        sendStateUpdate()
      }
      break
    }

    case 'addWire': {
      if (engine) {
        engine.addWire(message.wire)
        sendStateUpdate()
      }
      break
    }

    case 'removeWire': {
      if (engine) {
        engine.removeWire(message.wireId)
        sendStateUpdate()
      }
      break
    }

    case 'getState': {
      sendStateUpdate()
      break
    }

    default:
      sendResponse({ type: 'error', message: `Unknown message type` })
  }
}

// Signal that worker is ready
sendResponse({ type: 'ready' })
