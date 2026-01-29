import type { WorkflowEdgeData } from '@genfeedai/types';
import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';
import { calculatePerpendicularOffset } from '@/lib/utils/edgeOffsets';

/**
 * Custom Straight edge with offset support for parallel edge separation.
 * Preserves all CSS styling (edge-image, edge-video, executing, etc.)
 */
export function SmartStraightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
  markerEnd,
  markerStart,
  ...props
}: EdgeProps<WorkflowEdgeData>) {
  const offsetIndex = data?.offsetIndex ?? 0;
  const groupSize = data?.groupSize ?? 1;

  // Calculate perpendicular offset
  const offset = calculatePerpendicularOffset(offsetIndex, groupSize);

  // Apply offset perpendicular to the edge direction
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Normalized perpendicular vector
  const perpX = length > 0 ? -dy / length : 0;
  const perpY = length > 0 ? dx / length : 0;

  // Apply offset to source and target
  const offsetSourceX = sourceX + perpX * offset;
  const offsetSourceY = sourceY + perpY * offset;
  const offsetTargetX = targetX + perpX * offset;
  const offsetTargetY = targetY + perpY * offset;

  const [edgePath] = getStraightPath({
    sourceX: offsetSourceX,
    sourceY: offsetSourceY,
    targetX: offsetTargetX,
    targetY: offsetTargetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
      {...props}
    />
  );
}
