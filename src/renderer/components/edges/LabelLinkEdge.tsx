import { BezierEdge, type EdgeProps } from '@xyflow/react'
import { memo } from 'react'

export const LabelLinkEdge = memo(function LabelLinkEdge(props: EdgeProps) {
  return (
    <BezierEdge
      {...props}
      style={{
        stroke: '#10b981',
        strokeWidth: 1.5,
        strokeDasharray: '4,4',
        opacity: 0.6
      }}
    />
  )
})
