import { create } from 'zustand';

export type ContextMenuType = 'node' | 'edge' | 'pane' | 'selection' | null;

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuState {
  isOpen: boolean;
  position: ContextMenuPosition;
  menuType: ContextMenuType;
  targetId: string | null;
  targetIds: string[] | null;

  openNodeMenu: (nodeId: string, x: number, y: number) => void;
  openEdgeMenu: (edgeId: string, x: number, y: number) => void;
  openPaneMenu: (x: number, y: number) => void;
  openSelectionMenu: (nodeIds: string[], x: number, y: number) => void;
  close: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  position: { x: 0, y: 0 },
  menuType: null,
  targetId: null,
  targetIds: null,

  openNodeMenu: (nodeId, x, y) => {
    set({
      isOpen: true,
      position: { x, y },
      menuType: 'node',
      targetId: nodeId,
      targetIds: null,
    });
  },

  openEdgeMenu: (edgeId, x, y) => {
    set({
      isOpen: true,
      position: { x, y },
      menuType: 'edge',
      targetId: edgeId,
      targetIds: null,
    });
  },

  openPaneMenu: (x, y) => {
    set({
      isOpen: true,
      position: { x, y },
      menuType: 'pane',
      targetId: null,
      targetIds: null,
    });
  },

  openSelectionMenu: (nodeIds, x, y) => {
    set({
      isOpen: true,
      position: { x, y },
      menuType: 'selection',
      targetId: null,
      targetIds: nodeIds,
    });
  },

  close: () => {
    set({
      isOpen: false,
      menuType: null,
      targetId: null,
      targetIds: null,
    });
  },
}));
