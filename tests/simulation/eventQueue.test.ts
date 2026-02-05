import { describe, it, expect, beforeEach } from 'vitest'
import { EventQueue } from '../../src/renderer/simulation/core/EventQueue'
import { StateType } from '../../src/renderer/simulation/types/state'

describe('EventQueue', () => {
  let queue: EventQueue

  beforeEach(() => {
    queue = new EventQueue()
  })

  it('should start empty', () => {
    expect(queue.isEmpty()).toBe(true)
    expect(queue.size()).toBe(0)
    expect(queue.peek()).toBeUndefined()
  })

  it('should add and retrieve events in time order', () => {
    queue.push({ time: 10, gateId: 'gate1', portIndex: 0, newState: StateType.ONE })
    queue.push({ time: 5, gateId: 'gate2', portIndex: 0, newState: StateType.ZERO })
    queue.push({ time: 15, gateId: 'gate3', portIndex: 0, newState: StateType.ONE })

    expect(queue.size()).toBe(3)
    expect(queue.isEmpty()).toBe(false)

    const first = queue.pop()
    expect(first?.time).toBe(5)
    expect(first?.gateId).toBe('gate2')

    const second = queue.pop()
    expect(second?.time).toBe(10)
    expect(second?.gateId).toBe('gate1')

    const third = queue.pop()
    expect(third?.time).toBe(15)
    expect(third?.gateId).toBe('gate3')

    expect(queue.isEmpty()).toBe(true)
  })

  it('should maintain creation order for events at same time', () => {
    queue.push({ time: 10, gateId: 'gate1', portIndex: 0, newState: StateType.ONE })
    queue.push({ time: 10, gateId: 'gate2', portIndex: 0, newState: StateType.ZERO })
    queue.push({ time: 10, gateId: 'gate3', portIndex: 0, newState: StateType.ONE })

    expect(queue.pop()?.gateId).toBe('gate1')
    expect(queue.pop()?.gateId).toBe('gate2')
    expect(queue.pop()?.gateId).toBe('gate3')
  })

  it('should peek without removing', () => {
    queue.push({ time: 10, gateId: 'gate1', portIndex: 0, newState: StateType.ONE })

    expect(queue.peek()?.gateId).toBe('gate1')
    expect(queue.size()).toBe(1)

    expect(queue.peek()?.gateId).toBe('gate1')
    expect(queue.size()).toBe(1)
  })

  it('should clear all events', () => {
    queue.push({ time: 10, gateId: 'gate1', portIndex: 0, newState: StateType.ONE })
    queue.push({ time: 5, gateId: 'gate2', portIndex: 0, newState: StateType.ZERO })

    queue.clear()

    expect(queue.isEmpty()).toBe(true)
    expect(queue.size()).toBe(0)
  })

  it('should remove events for a specific gate', () => {
    queue.push({ time: 10, gateId: 'gate1', portIndex: 0, newState: StateType.ONE })
    queue.push({ time: 5, gateId: 'gate2', portIndex: 0, newState: StateType.ZERO })
    queue.push({ time: 15, gateId: 'gate1', portIndex: 1, newState: StateType.ZERO })
    queue.push({ time: 20, gateId: 'gate3', portIndex: 0, newState: StateType.ONE })

    queue.removeEventsForGate('gate1')

    expect(queue.size()).toBe(2)

    const first = queue.pop()
    expect(first?.gateId).toBe('gate2')

    const second = queue.pop()
    expect(second?.gateId).toBe('gate3')
  })

  it('should handle large number of events', () => {
    for (let i = 0; i < 1000; i++) {
      queue.push({
        time: Math.floor(Math.random() * 1000),
        gateId: `gate${i}`,
        portIndex: 0,
        newState: StateType.ONE
      })
    }

    expect(queue.size()).toBe(1000)

    let lastTime = -1
    while (!queue.isEmpty()) {
      const event = queue.pop()!
      expect(event.time).toBeGreaterThanOrEqual(lastTime)
      lastTime = event.time
    }
  })
})
