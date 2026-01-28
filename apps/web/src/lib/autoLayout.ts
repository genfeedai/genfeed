import Dagre from '@dagrejs/dagre';
import type { NodeType } from '@genfeedai/types';
import { NODE_DEFINITIONS } from '@genfeedai/types';
import type { Edge, Node } from '@xyflow/react';

interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing?: number;
  rankSpacing?: number;
}

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 150;

/**
 * Get handle info for a node type
 */
function getHandleInfo(nodeType: string, handleId: string, type: 'input' | 'output') {
  const nodeDef = NODE_DEFINITIONS[nodeType as NodeType];
  if (!nodeDef) return null;

  const handles = type === 'input' ? nodeDef.inputs : nodeDef.outputs;
  const index = handles.findIndex((h) => h.id === handleId);
  if (index === -1) return null;

  return { index, total: handles.length };
}

/**
 * Calculate the Y offset of a handle relative to node center
 * Handles are distributed evenly along the node height
 */
function getHandleYOffset(handleIndex: number, totalHandles: number, nodeHeight: number): number {
  // Handles are positioned at (index + 1) / (total + 1) * 100% of the node
  const percentage = (handleIndex + 1) / (totalHandles + 1);
  // Convert to offset from center
  return (percentage - 0.5) * nodeHeight;
}

/**
 * Align source nodes so their output handles match target input handle positions.
 * This creates horizontal edges instead of diagonal ones.
 */
function alignHandles(nodes: Node[], edges: Edge[]): Node[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Group edges by target to handle multiple inputs to same node
  const edgesByTarget = new Map<string, Edge[]>();
  for (const edge of edges) {
    const existing = edgesByTarget.get(edge.target) ?? [];
    existing.push(edge);
    edgesByTarget.set(edge.target, existing);
  }

  // For each target node, align its source nodes to the correct handle positions
  for (const [targetId, targetEdges] of edgesByTarget) {
    const targetNode = nodeMap.get(targetId);
    if (!targetNode) continue;

    const targetHeight = targetNode.measured?.height ?? DEFAULT_NODE_HEIGHT;

    // Sort edges by target handle index to maintain order
    targetEdges.sort((a, b) => {
      const aInfo = getHandleInfo(targetNode.type as string, a.targetHandle ?? '', 'input');
      const bInfo = getHandleInfo(targetNode.type as string, b.targetHandle ?? '', 'input');
      return (aInfo?.index ?? 0) - (bInfo?.index ?? 0);
    });

    // Align each source node
    for (const edge of targetEdges) {
      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode || !edge.targetHandle) continue;

      const targetHandleInfo = getHandleInfo(targetNode.type as string, edge.targetHandle, 'input');
      const sourceHandleInfo = getHandleInfo(
        sourceNode.type as string,
        edge.sourceHandle ?? 'output',
        'output'
      );

      if (!targetHandleInfo || !sourceHandleInfo) continue;

      const sourceHeight = sourceNode.measured?.height ?? DEFAULT_NODE_HEIGHT;

      // Calculate where the target handle is
      const targetHandleY =
        targetNode.position.y +
        targetHeight / 2 +
        getHandleYOffset(targetHandleInfo.index, targetHandleInfo.total, targetHeight);

      // Calculate where the source handle should be to align
      const sourceHandleOffset = getHandleYOffset(
        sourceHandleInfo.index,
        sourceHandleInfo.total,
        sourceHeight
      );

      // Adjust source node position so its handle aligns with target handle
      sourceNode.position.y = targetHandleY - sourceHeight / 2 - sourceHandleOffset;
    }
  }

  // Resolve overlaps within columns
  return resolveOverlaps(nodes);
}

/**
 * Resolve vertical overlaps between nodes in the same column
 */
function resolveOverlaps(nodes: Node[]): Node[] {
  // Group by approximate X position
  const COLUMN_THRESHOLD = 100;
  const columns = new Map<number, Node[]>();

  for (const node of nodes) {
    const columnKey = Math.round(node.position.x / COLUMN_THRESHOLD) * COLUMN_THRESHOLD;
    const column = columns.get(columnKey) ?? [];
    column.push(node);
    columns.set(columnKey, column);
  }

  // For each column, push apart overlapping nodes
  for (const columnNodes of columns.values()) {
    if (columnNodes.length <= 1) continue;

    // Sort by Y position
    columnNodes.sort((a, b) => a.position.y - b.position.y);

    // Push apart if overlapping
    const MIN_GAP = 20;
    for (let i = 1; i < columnNodes.length; i++) {
      const prev = columnNodes[i - 1];
      const curr = columnNodes[i];
      const prevBottom = prev.position.y + (prev.measured?.height ?? DEFAULT_NODE_HEIGHT);
      const currTop = curr.position.y;

      if (currTop < prevBottom + MIN_GAP) {
        curr.position.y = prevBottom + MIN_GAP;
      }
    }
  }

  return nodes;
}

/**
 * Auto-layout nodes using dagre algorithm
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param options - Layout configuration
 * @returns Nodes with updated positions
 */
export function getLayoutedNodes(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const { direction = 'LR', nodeSpacing = 50, rankSpacing = 100 } = options;

  const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 50,
    marginy: 50,
    // Improve edge crossing minimization
    ranker: 'network-simplex',
    acyclicer: 'greedy',
  });

  for (const node of nodes) {
    const width = node.measured?.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? DEFAULT_NODE_HEIGHT;
    graph.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  Dagre.layout(graph);

  // Apply dagre positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id);
    const width = node.measured?.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? DEFAULT_NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  // Align handles to create horizontal edges where possible
  return alignHandles(layoutedNodes, edges);
}
