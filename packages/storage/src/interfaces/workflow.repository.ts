import type {
  CreateWorkflowData,
  UpdateWorkflowData,
  WorkflowEntity,
} from '../entities/workflow.entity';
import type { FindOptions, IBaseRepository } from './base-repository.interface';

export interface IWorkflowRepository
  extends IBaseRepository<WorkflowEntity, CreateWorkflowData, UpdateWorkflowData> {
  findByName(name: string): Promise<WorkflowEntity | null>;
  findAllActive(options?: FindOptions<WorkflowEntity>): Promise<WorkflowEntity[]>;
  duplicate(id: string): Promise<WorkflowEntity>;
  search(query: string, options?: FindOptions<WorkflowEntity>): Promise<WorkflowEntity[]>;
}

export const WORKFLOW_REPOSITORY = Symbol('WORKFLOW_REPOSITORY');
