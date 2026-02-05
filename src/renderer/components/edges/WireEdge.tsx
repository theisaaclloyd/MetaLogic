import { BezierEdge, type EdgeProps } from '@xyflow/react'
import { memo } from 'react'
import { getWireStateColor } from '../../simulation/core/WireResolver'
import { StateType } from '../../simulation/types/state'
import type { WireEdgeData } from '../../stores/circuitStore'

interface WireEdgeProps extends EdgeProps {
  data?: WireEdgeData
}

export const WireEdge = memo(function WireEdge(props: WireEdgeProps) {
  const state = props.data?.state ?? StateType.UNKNOWN
  const color = getWireStateColor(state)

  // Determine stroke style based on state
  const getStrokeStyle = () => {
    switch (state) {
      case StateType.HI_Z:
        return '5,5' // Dashed for high impedance
      case StateType.UNKNOWN:
        return '2,2' // Dotted for unknown
      default:
        return undefined // Solid
    }
  }

  const strokeWidth = state === StateType.CONFLICT ? 3 : 2

  return (
    <BezierEdge
      {...props}
      style={{
        stroke: color,
        strokeWidth,
        strokeDasharray: getStrokeStyle()
      }}
    />
  )
})
