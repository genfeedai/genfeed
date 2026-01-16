import type { NodeType } from '@genfeedai/types';
import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { getLayoutedNodes } from '@/lib/autoLayout';
import { useWorkflowStore } from '@/store/workflowStore';

export function usePaneActions() {
  const { addNode, nodes, edges } = useWorkflowStore();
  const reactFlow = useReactFlow();

  const addNodeAtPosition = useCallback(
    (type: string, screenX: number, screenY: number) => {
      const position = reactFlow.screenToFlowPosition({ x: screenX, y: screenY });
      addNode(type as NodeType, position);
    },
    [addNode, reactFlow]
  );

  const selectAll = useCallback(() => {
    const nodeIds = nodes.map((node) => node.id);
    reactFlow.setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: nodeIds.includes(node.id),
      }))
    );
  }, [nodes, reactFlow]);

  const fitView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2 });
  }, [reactFlow]);

  const autoLayout = useCallback(
    (direction: 'TB' | 'LR' = 'LR') => {
      const layoutedNodes = getLayoutedNodes(nodes, edges, { direction });
      reactFlow.setNodes(layoutedNodes);
      // Fit view after layout with a small delay to allow DOM update
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.2 });
      }, 50);
    },
    [nodes, edges, reactFlow]
  );

  return {
    addNodeAtPosition,
    selectAll,
    fitView,
    autoLayout,
  };
}
