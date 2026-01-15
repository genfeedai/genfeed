import type { WorkflowEdgeEntity, WorkflowNodeEntity } from './workflow.entity';

export interface TemplateEntity {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNodeEntity[];
  edges: WorkflowEdgeEntity[];
  thumbnail?: string;
  isSystem: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  nodes?: WorkflowNodeEntity[];
  edges?: WorkflowEdgeEntity[];
  thumbnail?: string;
  isSystem?: boolean;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}
