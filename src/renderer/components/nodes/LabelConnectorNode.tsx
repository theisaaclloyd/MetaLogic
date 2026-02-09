import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LabelConnectorNodeData } from '../../stores/circuitStore'

interface LabelConnectorNodeProps extends NodeProps {
  data: LabelConnectorNodeData
}

export const LabelConnectorNodeComponent = memo(function LabelConnectorNode({
  data,
  selected
}: LabelConnectorNodeProps) {
  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium
        bg-emerald-900/60 border-emerald-700 text-emerald-300
        transition-all duration-150
        ${selected ? 'border-blue-500 shadow-blue-500/30 shadow-lg' : ''}
      `}
      style={{ minWidth: 60 }}
    >
      {/* Output connector: has a target handle on the LEFT (receives from gate output) */}
      {data.isOutput && (
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          style={{
            background: '#10b981',
            width: 8,
            height: 8,
            border: '2px solid #111827'
          }}
        />
      )}

      {/* Input connector: has a source handle on the RIGHT (sends to gate input) */}
      {!data.isOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          style={{
            background: '#10b981',
            width: 8,
            height: 8,
            border: '2px solid #111827'
          }}
        />
      )}

      <span className="select-none">
        {data.isOutput ? '\u25B6' : '\u25C0'} {data.label || 'LABEL'}
      </span>
    </div>
  )
})
