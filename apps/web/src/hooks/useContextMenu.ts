import type { WorkflowNodeData } from '@genfeedai/types';
import { useCallback, useMemo, useRef } from 'react';
import type { ContextMenuItemConfig } from '@/components/context-menu';
import {
  getEdgeMenuItems,
  getNodeMenuItems,
  getPaneMenuItems,
  getSelectionMenuItems,
} from '@/components/context-menu/menus';
import { workflowsApi } from '@/lib/api';
import { logger } from '@/lib/logger';
import { useContextMenuStore } from '@/store/contextMenuStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNodeActions } from './useNodeActions';
import { usePaneActions } from './usePaneActions';

export function useContextMenu() {
  const {
    isOpen,
    position,
    menuType,
    targetId,
    targetIds,
    openNodeMenu,
    openEdgeMenu,
    openPaneMenu,
    openSelectionMenu,
    close,
  } = useContextMenuStore();

  const { nodes, removeEdge, toggleNodeLock, createGroup, workflowId } = useWorkflowStore();
  const {
    clipboard,
    deleteNode,
    duplicate,
    copyNode,
    cutNode,
    deleteMultipleNodes,
    duplicateMultipleNodes,
  } = useNodeActions();
  const { addNodeAtPosition, selectAll, fitView, autoLayout } = usePaneActions();

  // Stable reference for handlers that don't need to change
  const stableHandlersRef = useRef({
    duplicate,
    copyNode,
    cutNode,
    deleteNode,
    deleteMultipleNodes,
    duplicateMultipleNodes,
    removeEdge,
    addNodeAtPosition,
    selectAll,
    fitView,
    autoLayout,
  });

  // Update ref on each render (avoids stale closures while maintaining stable reference)
  stableHandlersRef.current = {
    duplicate,
    copyNode,
    cutNode,
    deleteNode,
    deleteMultipleNodes,
    duplicateMultipleNodes,
    removeEdge,
    addNodeAtPosition,
    selectAll,
    fitView,
    autoLayout,
  };

  const lockNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && !node.data.locked) {
        toggleNodeLock(nodeId);
      }
    },
    [nodes, toggleNodeLock]
  );

  const unlockNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.data.locked) {
        toggleNodeLock(nodeId);
      }
    },
    [nodes, toggleNodeLock]
  );

  const groupNodes = useCallback(
    (nodeIds: string[]) => {
      if (nodeIds.length > 1) {
        createGroup(nodeIds);
      }
    },
    [createGroup]
  );

  const lockAllNodes = useCallback(
    (nodeIds: string[]) => {
      for (const nodeId of nodeIds) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node && !node.data.locked) {
          toggleNodeLock(nodeId);
        }
      }
    },
    [nodes, toggleNodeLock]
  );

  const unlockAllNodes = useCallback(
    (nodeIds: string[]) => {
      for (const nodeId of nodeIds) {
        const node = nodes.find((n) => n.id === nodeId);
        if (node?.data.locked) {
          toggleNodeLock(nodeId);
        }
      }
    },
    [nodes, toggleNodeLock]
  );

  const alignNodesHorizontally = useCallback((_nodeIds: string[]) => {
    // TODO: Implement horizontal alignment
  }, []);

  const alignNodesVertically = useCallback((_nodeIds: string[]) => {
    // TODO: Implement vertical alignment
  }, []);

  const pasteNodes = useCallback(() => {
    // TODO: Implement paste from clipboard
  }, []);

  const setAsThumbnail = useCallback(
    async (nodeId: string) => {
      if (!workflowId) return;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const data = node.data as WorkflowNodeData & {
        outputVideo?: string;
        outputImage?: string;
      };

      const thumbnailUrl = data.outputVideo || data.outputImage;
      if (!thumbnailUrl) return;

      try {
        await workflowsApi.setThumbnail(workflowId, thumbnailUrl, nodeId);
        logger.info('Thumbnail set successfully', { nodeId, workflowId });
      } catch (error) {
        logger.error('Failed to set thumbnail', error, { nodeId, workflowId });
      }
    },
    [workflowId, nodes]
  );

  const hasMediaOutput = useCallback(
    (nodeId: string): boolean => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return false;

      const data = node.data as WorkflowNodeData & {
        outputVideo?: string;
        outputImage?: string;
      };

      return Boolean(data.outputVideo || data.outputImage);
    },
    [nodes]
  );

  const getMenuItems = useCallback((): ContextMenuItemConfig[] => {
    if (!menuType) return [];

    const handlers = stableHandlersRef.current;

    switch (menuType) {
      case 'node': {
        if (!targetId) return [];
        const node = nodes.find((n) => n.id === targetId);
        const isLocked = Boolean(node?.data.locked);
        const nodeHasMediaOutput = hasMediaOutput(targetId);
        return getNodeMenuItems({
          nodeId: targetId,
          isLocked,
          hasMediaOutput: nodeHasMediaOutput,
          onDuplicate: handlers.duplicate,
          onLock: lockNode,
          onUnlock: unlockNode,
          onCut: handlers.cutNode,
          onCopy: handlers.copyNode,
          onDelete: handlers.deleteNode,
          onSetAsThumbnail: workflowId ? setAsThumbnail : undefined,
        });
      }

      case 'edge':
        if (!targetId) return [];
        return getEdgeMenuItems({
          edgeId: targetId,
          onDelete: handlers.removeEdge,
        });

      case 'pane':
        return getPaneMenuItems({
          screenX: position.x,
          screenY: position.y,
          hasClipboard: !!clipboard,
          onAddNode: handlers.addNodeAtPosition,
          onPaste: pasteNodes,
          onSelectAll: handlers.selectAll,
          onFitView: handlers.fitView,
          onAutoLayout: () => handlers.autoLayout('LR'),
        });

      case 'selection':
        if (!targetIds || targetIds.length === 0) return [];
        return getSelectionMenuItems({
          nodeIds: targetIds,
          onGroup: groupNodes,
          onDuplicateAll: handlers.duplicateMultipleNodes,
          onLockAll: lockAllNodes,
          onUnlockAll: unlockAllNodes,
          onAlignHorizontal: alignNodesHorizontally,
          onAlignVertical: alignNodesVertically,
          onDeleteAll: handlers.deleteMultipleNodes,
        });

      default:
        return [];
    }
  }, [
    menuType,
    targetId,
    targetIds,
    nodes,
    position,
    clipboard,
    lockNode,
    unlockNode,
    pasteNodes,
    groupNodes,
    lockAllNodes,
    unlockAllNodes,
    alignNodesHorizontally,
    alignNodesVertically,
    hasMediaOutput,
    setAsThumbnail,
    workflowId,
  ]);

  const menuItems = useMemo(() => getMenuItems(), [getMenuItems]);

  return {
    isOpen,
    position,
    menuType,
    menuItems,
    openNodeMenu,
    openEdgeMenu,
    openPaneMenu,
    openSelectionMenu,
    close,
  };
}
