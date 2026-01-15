export interface Position {
  x: number;
  y: number;
}

export interface WorkflowNodeEntity {
  id: string;
  type: string;
  position: Position;
  data?: Record<string, unknown>;
}

export interface WorkflowEdgeEntity {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface NodeGroupEntity {
  id: string;
  name: string;
  nodeIds: string[];
  isLocked?: boolean;
  color?: string;
  collapsed?: boolean;
}

export interface WorkflowEntity {
  id: string;
  name: string;
  description: string;
  version: number;
  nodes: WorkflowNodeEntity[];
  edges: WorkflowEdgeEntity[];
  edgeStyle: string;
  groups: NodeGroupEntity[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  nodes?: WorkflowNodeEntity[];
  edges?: WorkflowEdgeEntity[];
  edgeStyle?: string;
  groups?: NodeGroupEntity[];
}

export interface UpdateWorkflowData extends Partial<CreateWorkflowData> {}
