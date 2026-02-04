import type { EdgeStyle, WorkflowEdge, WorkflowNode } from '@genfeedai/types';
import type { StateCreator } from 'zustand';
import type { EditOperation } from '@/lib/chat/editOperations';
import { applyEditOperations } from '@/lib/chat/editOperations';
import type { NodeGroup } from '@/types/groups';
import type { WorkflowStore } from '../types';

export interface WorkflowSnapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  groups: NodeGroup[];
  edgeStyle: EdgeStyle;
}

export interface SnapshotSlice {
  previousWorkflowSnapshot: WorkflowSnapshot | null;
  manualChangeCount: number;
  captureSnapshot: () => void;
  revertToSnapshot: () => void;
  clearSnapshot: () => void;
  incrementManualChangeCount: () => void;
  applyEditOperations: (operations: EditOperation[]) => { applied: number; skipped: string[] };
}

export const createSnapshotSlice: StateCreator<
  WorkflowStore & SnapshotSlice,
  [],
  [],
  SnapshotSlice
> = (set, get) => ({
  previousWorkflowSnapshot: null,
  manualChangeCount: 0,

  captureSnapshot: () => {
    const state = get();
    const snapshot: WorkflowSnapshot = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
      groups: JSON.parse(JSON.stringify(state.groups)),
      edgeStyle: state.edgeStyle,
    };
    set({
      previousWorkflowSnapshot: snapshot,
      manualChangeCount: 0,
    });
  },

  revertToSnapshot: () => {
    const state = get();
    if (state.previousWorkflowSnapshot) {
      set({
        nodes: state.previousWorkflowSnapshot.nodes,
        edges: state.previousWorkflowSnapshot.edges,
        groups: state.previousWorkflowSnapshot.groups,
        edgeStyle: state.previousWorkflowSnapshot.edgeStyle,
        previousWorkflowSnapshot: null,
        manualChangeCount: 0,
        isDirty: true,
      });
    }
  },

  clearSnapshot: () => {
    set({
      previousWorkflowSnapshot: null,
      manualChangeCount: 0,
    });
  },

  incrementManualChangeCount: () => {
    const state = get();
    const newCount = state.manualChangeCount + 1;

    // Automatically clear snapshot after 3 manual changes
    if (newCount >= 3) {
      set({
        previousWorkflowSnapshot: null,
        manualChangeCount: 0,
      });
    } else {
      set({ manualChangeCount: newCount });
    }
  },

  applyEditOperations: (operations) => {
    const state = get();
    const result = applyEditOperations(operations, {
      nodes: state.nodes,
      edges: state.edges,
    });

    set({
      nodes: result.nodes,
      edges: result.edges,
      isDirty: true,
    });

    return { applied: result.applied, skipped: result.skipped };
  },
});
