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
 * Get the index of a target handle in the node definition
 */
function getHandleIndex(nodeType: string, handleId: string): number {
  const nodeDef = NODE_DEFINITIONS[nodeType as NodeType];
  if (!nodeDef) return -1;
  return nodeDef.inputs.findIndex((input) => input.id === handleId);
}

/**
 * Reorder nodes within the same column to minimize edge crossings.
 * For nodes connecting to the same target, order them by their target handle index.
 */
function reorderToMinimizeCrossings(nodes: Node[], edges: Edge[]): Node[] {
  // Group nodes by approximate X position (same column/rank)
  const COLUMN_THRESHOLD = 50;
  const columns = new Map<number, Node[]>();

  for (const node of nodes) {
    // Round to nearest threshold to group nodes in same column
    const columnKey = Math.round(node.position.x / COLUMN_THRESHOLD) * COLUMN_THRESHOLD;
    const column = columns.get(columnKey) ?? [];
    column.push(node);
    columns.set(columnKey, column);
  }

  // For each column, calculate optimal Y order based on target handle positions
  for (const columnNodes of columns.values()) {
    if (columnNodes.length <= 1) continue;

    // Calculate "target handle score" for each node
    // Lower score = should be positioned higher (lower Y)
    const nodeScores = new Map<string, number>();

    for (const node of columnNodes) {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length === 0) {
        nodeScores.set(node.id, node.position.y);
        continue;
      }

      let totalScore = 0;
      let count = 0;

      for (const edge of outgoingEdges) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!targetNode || !edge.targetHandle) continue;

        // Get handle index - lower index = higher position
        const handleIndex = getHandleIndex(targetNode.type as string, edge.targetHandle);
        if (handleIndex >= 0) {
          // Use target Y + handle index to calculate score
          // This ensures nodes connecting to higher handles are positioned higher
          totalScore += targetNode.position.y + handleIndex * 100;
          count++;
        }
      }

      nodeScores.set(node.id, count > 0 ? totalScore / count : node.position.y);
    }

    // Sort nodes by score (lower score = higher position = lower Y)
    columnNodes.sort((a, b) => {
      const scoreA = nodeScores.get(a.id) ?? 0;
      const scoreB = nodeScores.get(b.id) ?? 0;
      return scoreA - scoreB;
    });

    // Reassign Y positions while maintaining spacing
    const minY = Math.min(...columnNodes.map((n) => n.position.y));
    const spacing =
      columnNodes.length > 1
        ? (Math.max(...columnNodes.map((n) => n.position.y)) - minY) / (columnNodes.length - 1)
        : 0;

    columnNodes.forEach((node, index) => {
      node.position.y = minY + index * Math.max(spacing, 50);
    });
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

  // Reorder nodes within columns to minimize edge crossings
  return reorderToMinimizeCrossings(layoutedNodes, edges);
}
