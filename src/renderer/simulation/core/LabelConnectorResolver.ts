import type { Node, Edge } from '@xyflow/react'
import type { WireState } from '../types/state'
import { StateType } from '../types/state'
import type { LabelConnectorNodeData } from '../../stores/circuitStore'

/**
 * Synthesize point-to-point wires from label connectors.
 *
 * For each label name, collect all output connectors (which receive a signal
 * from a gate) and all input connectors (which send a signal to a gate).
 * Then create a wire for every (output, input) pair — cross-product.
 */
export function synthesizeLabelConnectorWires(nodes: Node[], edges: Edge[]): WireState[] {
  // Find label-connector nodes
  const lcNodes = nodes.filter((n) => n.type === 'label-connector')
  if (lcNodes.length === 0) return []

  // Find label-link edges
  const labelLinks = edges.filter((e) => e.type === 'label-link')
  if (labelLinks.length === 0) return []

  // For each label connector, resolve the connected gate/port from its label-link edge
  interface ResolvedConnector {
    label: string
    isOutput: boolean
    gateId: string
    portIndex: number
    isSource: boolean // whether the gate is the source (output connector) or target (input connector)
  }

  const resolved: ResolvedConnector[] = []

  for (const lcNode of lcNodes) {
    const lcData = lcNode.data as LabelConnectorNodeData
    const label = lcData.label
    if (!label) continue

    // Find the label-link edge for this connector
    for (const edge of labelLinks) {
      if (lcData.isOutput && edge.target === lcNode.id) {
        // Output connector: gate output → label connector
        // The gate is the source of the signal
        resolved.push({
          label,
          isOutput: true,
          gateId: edge.source,
          portIndex: parseInt(edge.sourceHandle?.replace('output-', '') ?? '0'),
          isSource: true
        })
        break
      } else if (!lcData.isOutput && edge.source === lcNode.id) {
        // Input connector: label connector → gate input
        // The gate is the target of the signal
        resolved.push({
          label,
          isOutput: false,
          gateId: edge.target,
          portIndex: parseInt(edge.targetHandle?.replace('input-', '') ?? '0'),
          isSource: false
        })
        break
      }
    }
  }

  // Group by label name
  const byLabel = new Map<string, { outputs: ResolvedConnector[]; inputs: ResolvedConnector[] }>()
  for (const rc of resolved) {
    let group = byLabel.get(rc.label)
    if (!group) {
      group = { outputs: [], inputs: [] }
      byLabel.set(rc.label, group)
    }
    if (rc.isOutput) {
      group.outputs.push(rc)
    } else {
      group.inputs.push(rc)
    }
  }

  // Synthesize wires: cross product of outputs × inputs
  const synthesized: WireState[] = []
  let wireCounter = 1

  for (const [, group] of byLabel) {
    for (const out of group.outputs) {
      for (const inp of group.inputs) {
        synthesized.push({
          id: `synth_wire_${wireCounter++}`,
          state: StateType.UNKNOWN,
          sourceGateId: out.gateId,
          sourcePortIndex: out.portIndex,
          targetGateId: inp.gateId,
          targetPortIndex: inp.portIndex
        })
      }
    }
  }

  return synthesized
}
