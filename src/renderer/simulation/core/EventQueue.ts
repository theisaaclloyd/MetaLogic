import type { SimulationEvent, TimeType } from '../types/state'

/**
 * Priority queue for simulation events.
 * Events are ordered by (time, creationTime) tuple for determinism.
 */
export class EventQueue {
  private heap: SimulationEvent[] = []
  private creationCounter: TimeType = 0

  /**
   * Add an event to the queue
   */
  push(event: Omit<SimulationEvent, 'creationTime'>): void {
    const fullEvent: SimulationEvent = {
      ...event,
      creationTime: this.creationCounter++
    }
    this.heap.push(fullEvent)
    this.bubbleUp(this.heap.length - 1)
  }

  /**
   * Remove and return the earliest event
   */
  pop(): SimulationEvent | undefined {
    if (this.heap.length === 0) return undefined
    if (this.heap.length === 1) return this.heap.pop()

    const result = this.heap[0]
    this.heap[0] = this.heap.pop()!
    this.bubbleDown(0)
    return result
  }

  /**
   * Look at the earliest event without removing it
   */
  peek(): SimulationEvent | undefined {
    return this.heap[0]
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.heap.length === 0
  }

  /**
   * Get number of events in queue
   */
  size(): number {
    return this.heap.length
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.heap = []
    this.creationCounter = 0
  }

  /**
   * Remove all events for a specific gate
   */
  removeEventsForGate(gateId: string): void {
    this.heap = this.heap.filter((e) => e.gateId !== gateId)
    this.rebuildHeap()
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.compare(this.heap[index]!, this.heap[parentIndex]!) >= 0) break
      this.swap(index, parentIndex)
      index = parentIndex
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length
    let currentIndex = index
    let shouldContinue = true

    while (shouldContinue) {
      const leftChild = 2 * currentIndex + 1
      const rightChild = 2 * currentIndex + 2
      let smallest = currentIndex

      if (leftChild < length && this.compare(this.heap[leftChild]!, this.heap[smallest]!) < 0) {
        smallest = leftChild
      }
      if (rightChild < length && this.compare(this.heap[rightChild]!, this.heap[smallest]!) < 0) {
        smallest = rightChild
      }

      if (smallest === currentIndex) {
        shouldContinue = false
      } else {
        this.swap(currentIndex, smallest)
        currentIndex = smallest
      }
    }
  }

  private compare(a: SimulationEvent, b: SimulationEvent): number {
    if (a.time !== b.time) return a.time - b.time
    return a.creationTime - b.creationTime
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i]!
    this.heap[i] = this.heap[j]!
    this.heap[j] = temp
  }

  private rebuildHeap(): void {
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i)
    }
  }
}
