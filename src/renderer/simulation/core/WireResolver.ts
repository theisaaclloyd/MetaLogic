import { StateType } from '../types/state'

/**
 * Resolves wire state from multiple driving sources.
 *
 * Resolution algorithm (from original CedarLogic):
 * - If CONFLICT present OR (ZERO AND ONE both present) → CONFLICT
 * - Else if ONE present → ONE
 * - Else if ZERO present → ZERO
 * - Else if UNKNOWN present → UNKNOWN
 * - Else → HI_Z
 */
export function resolveWireState(sources: StateType[]): StateType {
  if (sources.length === 0) {
    return StateType.HI_Z
  }

  let hasZero = false
  let hasOne = false
  let hasUnknown = false

  for (const state of sources) {
    switch (state) {
      case StateType.CONFLICT:
        return StateType.CONFLICT
      case StateType.ZERO:
        hasZero = true
        break
      case StateType.ONE:
        hasOne = true
        break
      case StateType.UNKNOWN:
        hasUnknown = true
        break
      case StateType.HI_Z:
        // HI_Z doesn't drive the wire
        break
    }
  }

  // Check for bus conflict (multiple drivers with different values)
  if (hasZero && hasOne) {
    return StateType.CONFLICT
  }

  if (hasOne) {
    return StateType.ONE
  }

  if (hasZero) {
    return StateType.ZERO
  }

  if (hasUnknown) {
    return StateType.UNKNOWN
  }

  return StateType.HI_Z
}

/**
 * Get CSS class for wire state visualization
 */
export function getWireStateClass(state: StateType): string {
  switch (state) {
    case StateType.ZERO:
      return 'wire-zero'
    case StateType.ONE:
      return 'wire-one'
    case StateType.HI_Z:
      return 'wire-hiz'
    case StateType.CONFLICT:
      return 'wire-conflict'
    case StateType.UNKNOWN:
      return 'wire-unknown'
    default:
      return 'wire-unknown'
  }
}

/**
 * Get color for wire state
 */
export function getWireStateColor(state: StateType): string {
  switch (state) {
    case StateType.ZERO:
      return '#3b82f6' // blue
    case StateType.ONE:
      return '#ef4444' // red
    case StateType.HI_Z:
      return '#9ca3af' // gray
    case StateType.CONFLICT:
      return '#f59e0b' // amber
    case StateType.UNKNOWN:
      return '#8b5cf6' // purple
    default:
      return '#8b5cf6'
  }
}
