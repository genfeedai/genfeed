import type { WorkflowEdgeData } from '@genfeedai/types';
import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react';
import { calculatePerpendicularOffset } from '@/lib/utils/edgeOffsets';

/**
 * Custom Bezier edge with offset support for parallel edge separation.
 * Preserves all CSS styling (edge-image, edge-video, executing, etc.)
 */
export function SmartBezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
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
  // For horizontal edges (left-right), offset the Y coordinates
  // For vertical edges (top-bottom), offset the X coordinates
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

  const [edgePath] = getBezierPath({
    sourceX: offsetSourceX,
    sourceY: offsetSourceY,
    sourcePosition,
    targetX: offsetTargetX,
    targetY: offsetTargetY,
    targetPosition,
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
