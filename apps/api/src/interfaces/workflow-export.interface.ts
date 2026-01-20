/**
 * Workflow export format for sharing workflows via JSON
 * Version field allows for future format migrations
 */
export interface WorkflowExport {
  name: string;
  description: string;
  version: string; // Export format version
  nodes: WorkflowExportNode[];
  edges: WorkflowExportEdge[];
  edgeStyle: string;
  groups: WorkflowExportGroup[];
  metadata: {
    exportedAt: string;
    exportedFrom: string;
    originalId: string;
  };
}

export interface WorkflowExportNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowExportEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface WorkflowExportGroup {
  id: string;
  name: string;
  nodeIds: string[];
  isLocked: boolean;
  color?: string;
  collapsed?: boolean;
}

// Current export format version
export const WORKFLOW_EXPORT_VERSION = '1.0.0';
