import { describe, it, expect } from 'vitest'
import { StateType } from '../../src/renderer/simulation/types/state'
import { resolveWireState } from '../../src/renderer/simulation/core/WireResolver'

describe('Wire State Resolution', () => {
  it('should return HI_Z for empty sources', () => {
    expect(resolveWireState([])).toBe(StateType.HI_Z)
  })

  it('should return HI_Z for all HI_Z sources', () => {
    expect(resolveWireState([StateType.HI_Z, StateType.HI_Z])).toBe(StateType.HI_Z)
  })

  it('should return ONE when any source is ONE', () => {
    expect(resolveWireState([StateType.HI_Z, StateType.ONE])).toBe(StateType.ONE)
    expect(resolveWireState([StateType.ONE])).toBe(StateType.ONE)
  })

  it('should return ZERO when only ZERO sources (no ONE)', () => {
    expect(resolveWireState([StateType.HI_Z, StateType.ZERO])).toBe(StateType.ZERO)
    expect(resolveWireState([StateType.ZERO])).toBe(StateType.ZERO)
  })

  it('should return CONFLICT when ZERO and ONE are both present', () => {
    expect(resolveWireState([StateType.ZERO, StateType.ONE])).toBe(StateType.CONFLICT)
  })

  it('should return CONFLICT when CONFLICT is present', () => {
    expect(resolveWireState([StateType.ONE, StateType.CONFLICT])).toBe(StateType.CONFLICT)
    expect(resolveWireState([StateType.CONFLICT])).toBe(StateType.CONFLICT)
  })

  it('should return UNKNOWN when only UNKNOWN sources (no ZERO/ONE)', () => {
    expect(resolveWireState([StateType.HI_Z, StateType.UNKNOWN])).toBe(StateType.UNKNOWN)
    expect(resolveWireState([StateType.UNKNOWN])).toBe(StateType.UNKNOWN)
  })

  it('should prioritize driven states over HI_Z', () => {
    expect(resolveWireState([StateType.HI_Z, StateType.HI_Z, StateType.ONE])).toBe(StateType.ONE)
    expect(resolveWireState([StateType.HI_Z, StateType.HI_Z, StateType.ZERO])).toBe(StateType.ZERO)
  })
})
