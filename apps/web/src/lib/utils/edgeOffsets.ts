import type { WorkflowEdge, WorkflowEdgeData } from '@genfeedai/types';

/**
 * Group edges by source-target pairs and assign offset indices.
 * Edges sharing the same source and target get sequential indices for visual separation.
 *
 * Also groups edges that share the same target (regardless of source) to avoid
 * overlapping at the target node.
 */
export function calculateEdgeOffsets(
  edges: WorkflowEdge[]
): Map<string, { offsetIndex: number; groupSize: number }> {
  const result = new Map<string, { offsetIndex: number; groupSize: number }>();

  // Group edges by target node (edges going to the same target should be separated)
  const targetGroups = new Map<string, WorkflowEdge[]>();

  for (const edge of edges) {
    const key = edge.target;
    const group = targetGroups.get(key) ?? [];
    group.push(edge);
    targetGroups.set(key, group);
  }

  // Assign offset indices within each group
  for (const [, group] of targetGroups) {
    if (group.length === 1) {
      // Single edge to this target - no offset needed
      result.set(group[0].id, { offsetIndex: 0, groupSize: 1 });
    } else {
      // Multiple edges to same target - assign offsets
      // Sort by source for consistent ordering
      group.sort((a, b) => a.source.localeCompare(b.source));

      for (let i = 0; i < group.length; i++) {
        result.set(group[i].id, { offsetIndex: i, groupSize: group.length });
      }
    }
  }

  return result;
}

/**
 * Apply offset data to edges for use with custom edge components
 */
export function applyEdgeOffsets(
  edges: WorkflowEdge[],
  offsets: Map<string, { offsetIndex: number; groupSize: number }>
): WorkflowEdge[] {
  return edges.map((edge) => {
    const offsetData = offsets.get(edge.id);
    if (!offsetData || offsetData.groupSize <= 1) {
      return edge;
    }

    const data: WorkflowEdgeData = {
      ...edge.data,
      offsetIndex: offsetData.offsetIndex,
      groupSize: offsetData.groupSize,
    };

    return { ...edge, data };
  });
}

/**
 * Calculate perpendicular offset for edge endpoints
 * Used by custom edge components to separate parallel edges
 */
export function calculatePerpendicularOffset(
  offsetIndex: number,
  groupSize: number,
  spacing: number = 15
): number {
  if (groupSize <= 1) return 0;

  // Center the group around 0
  // For 2 edges: offsets are -7.5 and 7.5
  // For 3 edges: offsets are -15, 0, 15
  const centerIndex = (groupSize - 1) / 2;
  return (offsetIndex - centerIndex) * spacing;
}
