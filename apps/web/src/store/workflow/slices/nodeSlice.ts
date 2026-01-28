import type { NodeType, WorkflowNode, WorkflowNodeData } from '@genfeedai/types';
import { NODE_DEFINITIONS } from '@genfeedai/types';
import type { XYPosition } from '@xyflow/react';
import type { StateCreator } from 'zustand';
import { generateId } from '../helpers/nodeHelpers';
import type { WorkflowStore } from '../types';

/**
 * Extract output value from a node based on its type
 */
function getNodeOutput(node: WorkflowNode): string | null {
  const data = node.data as Record<string, unknown>;
  const output =
    data.outputImage ?? data.outputVideo ?? data.outputText ?? data.outputAudio ?? null;
  if (output === null) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output.length > 0) return String(output[0]);
  return null;
}

/**
 * Map source node output to target node input field based on node types
 */
function mapOutputToInput(
  output: string,
  sourceType: string,
  targetType: string
): Record<string, unknown> | null {
  if (targetType === 'output') {
    // Determine if source outputs video or image
    const isVideo =
      sourceType.includes('video') || sourceType === 'videoGen' || sourceType === 'animation';
    const isImage = sourceType.includes('image') || sourceType === 'imageGen';

    if (isVideo) {
      return { inputVideo: output, inputImage: null, inputType: 'video' };
    }
    if (isImage) {
      return { inputImage: output, inputVideo: null, inputType: 'image' };
    }
  }
  return null;
}

export interface NodeSlice {
  addNode: (type: NodeType, position: XYPosition) => string;
  updateNodeData: <T extends WorkflowNodeData>(nodeId: string, data: Partial<T>) => void;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string | null;
  propagateOutputsDownstream: (sourceNodeId: string) => void;
}

export const createNodeSlice: StateCreator<WorkflowStore, [], [], NodeSlice> = (set, get) => ({
  addNode: (type, position) => {
    const nodeDef = NODE_DEFINITIONS[type];
    if (!nodeDef) return '';

    const id = generateId();
    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data: {
        ...nodeDef.defaultData,
        label: nodeDef.label,
        status: 'idle',
      } as WorkflowNodeData,
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));

    return id;
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
      isDirty: true,
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      isDirty: true,
    }));
  },

  duplicateNode: (nodeId) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const newId = generateId();
    const newNode: WorkflowNode = {
      ...node,
      id: newId,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        status: 'idle',
        jobId: null,
      } as WorkflowNodeData,
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));

    return newId;
  },

  propagateOutputsDownstream: (sourceNodeId) => {
    const { nodes, edges, updateNodeData } = get();
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    if (!sourceNode) return;

    const outputValue = getNodeOutput(sourceNode);
    if (!outputValue) return;

    const downstreamEdges = edges.filter((e) => e.source === sourceNodeId);

    for (const edge of downstreamEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode) continue;

      const inputUpdate = mapOutputToInput(outputValue, sourceNode.type, targetNode.type);
      if (inputUpdate) {
        updateNodeData(edge.target, inputUpdate);
      }
    }
  },
});
