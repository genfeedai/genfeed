import type { Model } from 'mongoose';
import type {
  CostSummaryData,
  CreateExecutionData,
  ExecutionEntity,
  NodeResultData,
  UpdateExecutionData,
} from '../../entities/execution.entity';
import type { FindOptions } from '../../interfaces/base-repository.interface';
import type { IExecutionRepository } from '../../interfaces/execution.repository';

export class ExecutionMongoRepository implements IExecutionRepository {
  constructor(private executionModel: Model<unknown>) {}

  async create(data: CreateExecutionData): Promise<ExecutionEntity> {
    const execution = new this.executionModel({
      workflowId: data.workflowId,
      executionMode: data.executionMode ?? 'sync',
      status: 'pending',
      nodeResults: [],
      queueJobIds: [],
      costSummary: {},
      totalCost: 0,
    });
    const saved = await execution.save();
    return this.mapDocumentToEntity(saved);
  }

  async findById(id: string): Promise<ExecutionEntity | null> {
    const doc = await this.executionModel.findOne({ _id: id, isDeleted: false }).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findOne(options: FindOptions<ExecutionEntity>): Promise<ExecutionEntity | null> {
    const filter = this.buildFilter(options);
    const doc = await this.executionModel.findOne(filter).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findAll(options?: FindOptions<ExecutionEntity>): Promise<ExecutionEntity[]> {
    const filter = this.buildFilter(options);
    let query = this.executionModel.find(filter);

    if (options?.sortBy) {
      const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
      query = query.sort({ [options.sortBy]: sortDirection });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    if (options?.offset) query = query.skip(options.offset);
    if (options?.limit) query = query.limit(options.limit);

    const docs = await query.exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async findByWorkflowId(
    workflowId: string,
    options?: FindOptions<ExecutionEntity>
  ): Promise<ExecutionEntity[]> {
    const filter = this.buildFilter(options);
    (filter as Record<string, unknown>).workflowId = workflowId;

    let query = this.executionModel.find(filter);

    if (options?.sortBy) {
      const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
      query = query.sort({ [options.sortBy]: sortDirection });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    if (options?.offset) query = query.skip(options.offset);
    if (options?.limit) query = query.limit(options.limit);

    const docs = await query.exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async findByStatus(
    status: string,
    options?: FindOptions<ExecutionEntity>
  ): Promise<ExecutionEntity[]> {
    const filter = this.buildFilter(options);
    (filter as Record<string, unknown>).status = status;

    const docs = await this.executionModel.find(filter).exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async update(id: string, data: UpdateExecutionData): Promise<ExecutionEntity | null> {
    const doc = await this.executionModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async updateStatus(id: string, status: string, error?: string): Promise<ExecutionEntity | null> {
    const updateData: UpdateExecutionData = {
      status: status as ExecutionEntity['status'],
    };
    if (error) updateData.error = error;
    return this.update(id, updateData);
  }

  async updateNodeResult(
    executionId: string,
    nodeResult: NodeResultData
  ): Promise<ExecutionEntity | null> {
    const execution = await this.findById(executionId);
    if (!execution) return null;

    const nodeResults = [...execution.nodeResults];
    const existingIndex = nodeResults.findIndex((r) => r.nodeId === nodeResult.nodeId);

    if (existingIndex >= 0) {
      nodeResults[existingIndex] = nodeResult;
    } else {
      nodeResults.push(nodeResult);
    }

    return this.update(executionId, { nodeResults });
  }

  async updateCostSummary(
    id: string,
    costSummary: CostSummaryData
  ): Promise<ExecutionEntity | null> {
    return this.update(id, { costSummary });
  }

  async softDelete(id: string): Promise<ExecutionEntity | null> {
    const doc = await this.executionModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.executionModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async count(options?: FindOptions<ExecutionEntity>): Promise<number> {
    const filter = this.buildFilter(options);
    return this.executionModel.countDocuments(filter).exec();
  }

  private buildFilter(options?: FindOptions<ExecutionEntity>): Record<string, unknown> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (options?.where) {
      Object.assign(filter, options.where);
    }

    return filter;
  }

  private mapDocumentToEntity(doc: unknown): ExecutionEntity {
    const d = doc as Record<string, unknown>;
    return {
      id: String(d._id),
      workflowId: String(d.workflowId),
      status: (d.status as ExecutionEntity['status']) ?? 'pending',
      startedAt: d.startedAt ? new Date(d.startedAt as string) : undefined,
      completedAt: d.completedAt ? new Date(d.completedAt as string) : undefined,
      totalCost: (d.totalCost as number) ?? 0,
      costSummary: (d.costSummary as CostSummaryData) ?? {},
      nodeResults: (d.nodeResults as NodeResultData[]) ?? [],
      error: (d.error as string) ?? undefined,
      isDeleted: (d.isDeleted as boolean) ?? false,
      executionMode: (d.executionMode as 'sync' | 'async') ?? 'sync',
      queueJobIds: (d.queueJobIds as string[]) ?? [],
      resumedFrom: (d.resumedFrom as string) ?? undefined,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
    };
  }
}
