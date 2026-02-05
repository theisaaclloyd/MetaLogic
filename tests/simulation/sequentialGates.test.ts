import { describe, it, expect, beforeEach } from 'vitest'
import { StateType } from '../../src/renderer/simulation/types/state'
import { DFlipFlop, JKFlipFlop } from '../../src/renderer/simulation/gates/SequentialGates'

describe('Sequential Gates', () => {
  describe('D Flip-Flop', () => {
    let flipflop: DFlipFlop

    beforeEach(() => {
      flipflop = new DFlipFlop('dff1')
    })

    it('should start with Q=0', () => {
      const result = flipflop.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO) // Q
      expect(result.outputs[1]).toBe(StateType.ONE)  // Q'
    })

    it('should capture D on rising clock edge', () => {
      // Set D=1, CLK=0
      flipflop.setInput(0, StateType.ONE)  // D
      flipflop.setInput(1, StateType.ZERO) // CLK
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Rising edge: CLK 0->1
      flipflop.setInput(1, StateType.ONE)
      const result = flipflop.evaluate()

      expect(result.outputs[0]).toBe(StateType.ONE)  // Q captured D
      expect(result.outputs[1]).toBe(StateType.ZERO) // Q'
    })

    it('should hold value when clock is stable', () => {
      // Initial capture of D=1
      flipflop.setInput(0, StateType.ONE)
      flipflop.setInput(1, StateType.ZERO)
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      flipflop.setInput(1, StateType.ONE) // Rising edge
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Change D while clock is high - should not affect output
      flipflop.setInput(0, StateType.ZERO)
      flipflop.setInput(1, StateType.ONE) // Clock stays high
      const result = flipflop.evaluate()

      expect(result.outputs[0]).toBe(StateType.ONE) // Q still holds
    })

    it('should not capture on falling edge', () => {
      // Start with Q=0
      flipflop.setInput(0, StateType.ONE)  // D=1
      flipflop.setInput(1, StateType.ONE)  // CLK=1
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Falling edge: CLK 1->0
      flipflop.setInput(1, StateType.ZERO)
      const result = flipflop.evaluate()

      expect(result.outputs[0]).toBe(StateType.ZERO) // Q unchanged from initial
    })

    it('should reset properly', () => {
      // Capture D=1
      flipflop.setInput(0, StateType.ONE)
      flipflop.setInput(1, StateType.ZERO)
      flipflop.evaluate()
      flipflop.updatePreviousInputs()
      flipflop.setInput(1, StateType.ONE)
      flipflop.evaluate()

      expect(flipflop.evaluate().outputs[0]).toBe(StateType.ONE)

      flipflop.reset()

      expect(flipflop.evaluate().outputs[0]).toBe(StateType.ZERO)
    })
  })

  describe('JK Flip-Flop', () => {
    let flipflop: JKFlipFlop

    beforeEach(() => {
      flipflop = new JKFlipFlop('jkff1')
    })

    it('should start with Q=0', () => {
      const result = flipflop.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO) // Q
      expect(result.outputs[1]).toBe(StateType.ONE)  // Q'
    })

    it('should hold when J=0, K=0', () => {
      // Start with Q=0
      flipflop.setInput(0, StateType.ZERO) // J
      flipflop.setInput(1, StateType.ZERO) // K
      flipflop.setInput(2, StateType.ZERO) // CLK
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Rising edge
      flipflop.setInput(2, StateType.ONE)
      const result = flipflop.evaluate()

      expect(result.outputs[0]).toBe(StateType.ZERO) // Q holds
    })

    it('should set when J=1, K=0', () => {
      flipflop.setInput(0, StateType.ONE)  // J
      flipflop.setInput(1, StateType.ZERO) // K
      flipflop.setInput(2, StateType.ZERO) // CLK
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Rising edge
      flipflop.setInput(2, StateType.ONE)
      const result = flipflop.evaluate()

      expect(result.outputs[0]).toBe(StateType.ONE) // Q set
    })

    it('should reset when J=0, K=1', () => {
      // First set Q=1
      flipflop.setInput(0, StateType.ONE)
      flipflop.setInput(1, StateType.ZERO)
      flipflop.setInput(2, StateType.ZERO)
      flipflop.evaluate()
      flipflop.updatePreviousInputs()
      flipflop.setInput(2, StateType.ONE)
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Now reset
      flipflop.setInput(0, StateType.ZERO) // J
      flipflop.setInput(1, StateType.ONE)  // K
      flipflop.setInput(2, StateType.ZERO) // CLK
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      flipflop.setInput(2, StateType.ONE) // Rising edge
      const result = flipflop.evaluate()

      expect(result.outputs[0]).toBe(StateType.ZERO) // Q reset
    })

    it('should toggle when J=1, K=1', () => {
      // Start with Q=0
      flipflop.setInput(0, StateType.ONE) // J
      flipflop.setInput(1, StateType.ONE) // K
      flipflop.setInput(2, StateType.ZERO)
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // First toggle: 0 -> 1
      flipflop.setInput(2, StateType.ONE)
      let result = flipflop.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)

      flipflop.updatePreviousInputs()
      flipflop.setInput(2, StateType.ZERO)
      flipflop.evaluate()
      flipflop.updatePreviousInputs()

      // Second toggle: 1 -> 0
      flipflop.setInput(2, StateType.ONE)
      result = flipflop.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })
  })
})
