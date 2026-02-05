import { describe, it, expect, beforeEach } from 'vitest'
import { StateType } from '../../src/renderer/simulation/types/state'
import {
  AndGate,
  OrGate,
  NotGate,
  XorGate,
  NandGate,
  NorGate,
  XnorGate,
  ToggleGate,
  LedGate
} from '../../src/renderer/simulation/gates/BasicGates'

describe('Basic Gates', () => {
  describe('AND Gate', () => {
    it('should output ONE when all inputs are ONE', () => {
      const gate = new AndGate('and1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })

    it('should output ZERO when any input is ZERO', () => {
      const gate = new AndGate('and1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should output ZERO when all inputs are ZERO', () => {
      const gate = new AndGate('and1', 2)
      gate.setInput(0, StateType.ZERO)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should output CONFLICT when any input is CONFLICT', () => {
      const gate = new AndGate('and1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.CONFLICT)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.CONFLICT)
    })
  })

  describe('OR Gate', () => {
    it('should output ONE when any input is ONE', () => {
      const gate = new OrGate('or1', 2)
      gate.setInput(0, StateType.ZERO)
      gate.setInput(1, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })

    it('should output ZERO when all inputs are ZERO', () => {
      const gate = new OrGate('or1', 2)
      gate.setInput(0, StateType.ZERO)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })
  })

  describe('NOT Gate', () => {
    it('should invert ONE to ZERO', () => {
      const gate = new NotGate('not1')
      gate.setInput(0, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should invert ZERO to ONE', () => {
      const gate = new NotGate('not1')
      gate.setInput(0, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })

    it('should output UNKNOWN for HI_Z input', () => {
      const gate = new NotGate('not1')
      gate.setInput(0, StateType.HI_Z)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.UNKNOWN)
    })
  })

  describe('XOR Gate', () => {
    it('should output ONE when inputs differ', () => {
      const gate = new XorGate('xor1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })

    it('should output ZERO when inputs are the same', () => {
      const gate = new XorGate('xor1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })
  })

  describe('NAND Gate', () => {
    it('should output ZERO when all inputs are ONE', () => {
      const gate = new NandGate('nand1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should output ONE when any input is ZERO', () => {
      const gate = new NandGate('nand1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })
  })

  describe('NOR Gate', () => {
    it('should output ZERO when any input is ONE', () => {
      const gate = new NorGate('nor1', 2)
      gate.setInput(0, StateType.ZERO)
      gate.setInput(1, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should output ONE when all inputs are ZERO', () => {
      const gate = new NorGate('nor1', 2)
      gate.setInput(0, StateType.ZERO)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })
  })

  describe('XNOR Gate', () => {
    it('should output ZERO when inputs differ', () => {
      const gate = new XnorGate('xnor1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ZERO)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should output ONE when inputs are the same', () => {
      const gate = new XnorGate('xnor1', 2)
      gate.setInput(0, StateType.ONE)
      gate.setInput(1, StateType.ONE)
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)
    })
  })

  describe('Toggle Gate', () => {
    it('should start with ZERO output', () => {
      const gate = new ToggleGate('toggle1')
      const result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })

    it('should toggle between ZERO and ONE', () => {
      const gate = new ToggleGate('toggle1')

      gate.toggle()
      let result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ONE)

      gate.toggle()
      result = gate.evaluate()
      expect(result.outputs[0]).toBe(StateType.ZERO)
    })
  })

  describe('LED Gate', () => {
    it('should display input state', () => {
      const gate = new LedGate('led1')
      gate.setInput(0, StateType.ONE)
      expect(gate.getDisplayState()).toBe(StateType.ONE)

      gate.setInput(0, StateType.ZERO)
      expect(gate.getDisplayState()).toBe(StateType.ZERO)
    })
  })
})
