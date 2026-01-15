import type {
  CostSummaryData,
  CreateExecutionData,
  ExecutionEntity,
  NodeResultData,
  UpdateExecutionData,
} from '../entities/execution.entity';
import type { FindOptions, IBaseRepository } from './base-repository.interface';

export interface IExecutionRepository
  extends IBaseRepository<ExecutionEntity, CreateExecutionData, UpdateExecutionData> {
  findByWorkflowId(
    workflowId: string,
    options?: FindOptions<ExecutionEntity>
  ): Promise<ExecutionEntity[]>;
  updateStatus(id: string, status: string, error?: string): Promise<ExecutionEntity | null>;
  updateNodeResult(
    executionId: string,
    nodeResult: NodeResultData
  ): Promise<ExecutionEntity | null>;
  updateCostSummary(id: string, costSummary: CostSummaryData): Promise<ExecutionEntity | null>;
  findByStatus(status: string, options?: FindOptions<ExecutionEntity>): Promise<ExecutionEntity[]>;
}

export const EXECUTION_REPOSITORY = Symbol('EXECUTION_REPOSITORY');
