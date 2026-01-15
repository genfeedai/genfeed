export interface NodeResultData {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  cost?: number;
}

export interface CostSummaryData {
  estimated?: number;
  actual?: number;
  variance?: number;
}

export interface ExecutionEntity {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  totalCost: number;
  costSummary: CostSummaryData;
  nodeResults: NodeResultData[];
  error?: string;
  isDeleted: boolean;
  executionMode: 'sync' | 'async';
  queueJobIds: string[];
  resumedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExecutionData {
  workflowId: string;
  executionMode?: 'sync' | 'async';
}

export interface UpdateExecutionData {
  status?: ExecutionEntity['status'];
  startedAt?: Date;
  completedAt?: Date;
  totalCost?: number;
  costSummary?: CostSummaryData;
  nodeResults?: NodeResultData[];
  error?: string;
  queueJobIds?: string[];
}
