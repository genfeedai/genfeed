import type { WorkflowEdge, WorkflowInterface, WorkflowNode } from '@genfeedai/types';
import type { NodeGroup } from '@/types/groups';
import { apiClient } from './client';

/**
 * Workflow export format for sharing workflows via JSON
 */
export interface WorkflowExport {
  name: string;
  description: string;
  version: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type?: string;
  }>;
  edgeStyle: string;
  groups: Array<{
    id: string;
    name: string;
    nodeIds: string[];
    isLocked: boolean;
    color?: string;
    collapsed?: boolean;
  }>;
  metadata: {
    exportedAt: string;
    exportedFrom: string;
    originalId: string;
  };
}

export interface WorkflowData {
  _id: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  edgeStyle: string;
  groups?: NodeGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  edgeStyle?: string;
  groups?: NodeGroup[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  edgeStyle?: string;
  groups?: NodeGroup[];
}

export const workflowsApi = {
  /**
   * Get all workflows
   */
  getAll: (signal?: AbortSignal): Promise<WorkflowData[]> =>
    apiClient.get<WorkflowData[]>('/workflows', { signal }),

  /**
   * Get a single workflow by ID
   */
  getById: (id: string, signal?: AbortSignal): Promise<WorkflowData> =>
    apiClient.get<WorkflowData>(`/workflows/${id}`, { signal }),

  /**
   * Create a new workflow
   */
  create: (data: CreateWorkflowInput, signal?: AbortSignal): Promise<WorkflowData> =>
    apiClient.post<WorkflowData>('/workflows', data, { signal }),

  /**
   * Update an existing workflow
   */
  update: (id: string, data: UpdateWorkflowInput, signal?: AbortSignal): Promise<WorkflowData> =>
    apiClient.put<WorkflowData>(`/workflows/${id}`, data, { signal }),

  /**
   * Delete a workflow (soft delete)
   */
  delete: (id: string, signal?: AbortSignal): Promise<void> =>
    apiClient.delete<void>(`/workflows/${id}`, { signal }),

  /**
   * Duplicate a workflow
   */
  duplicate: (id: string, signal?: AbortSignal): Promise<WorkflowData> =>
    apiClient.post<WorkflowData>(`/workflows/${id}/duplicate`, undefined, { signal }),

  // Composition endpoints

  /**
   * Get the interface of a workflow (inputs/outputs defined by boundary nodes)
   */
  getInterface: (id: string, signal?: AbortSignal): Promise<WorkflowInterface> =>
    apiClient.get<WorkflowInterface>(`/workflows/${id}/interface`, { signal }),

  /**
   * Get workflows that can be referenced as subworkflows (have defined interface)
   */
  getReferencable: (
    excludeWorkflowId?: string,
    signal?: AbortSignal
  ): Promise<Array<WorkflowData & { interface: WorkflowInterface }>> =>
    apiClient.get<Array<WorkflowData & { interface: WorkflowInterface }>>(
      `/workflows/referencable${excludeWorkflowId ? `?exclude=${excludeWorkflowId}` : ''}`,
      { signal }
    ),

  /**
   * Validate a workflow reference (checks for circular references)
   * Returns the child workflow's interface if valid
   */
  validateReference: (
    parentWorkflowId: string,
    childWorkflowId: string,
    signal?: AbortSignal
  ): Promise<WorkflowInterface> =>
    apiClient.post<WorkflowInterface>(
      `/workflows/${parentWorkflowId}/validate-reference`,
      { childWorkflowId },
      { signal }
    ),

  // Export/Import endpoints

  /**
   * Export a workflow to JSON format for sharing
   */
  export: (id: string, signal?: AbortSignal): Promise<WorkflowExport> =>
    apiClient.get<WorkflowExport>(`/workflows/${id}/export`, { signal }),

  /**
   * Import a workflow from JSON export
   */
  import: (data: WorkflowExport, signal?: AbortSignal): Promise<WorkflowData> =>
    apiClient.post<WorkflowData>('/workflows/import', data, { signal }),

  /**
   * Download workflow as JSON file (client-side helper)
   */
  downloadAsFile: async (id: string, signal?: AbortSignal): Promise<void> => {
    const workflow = await workflowsApi.export(id, signal);
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.toLowerCase().replace(/\s+/g, '-')}.genfeed.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Import workflow from file (client-side helper)
   */
  importFromFile: async (file: File, signal?: AbortSignal): Promise<WorkflowData> => {
    const text = await file.text();
    const data = JSON.parse(text) as WorkflowExport;
    return workflowsApi.import(data, signal);
  },
};
