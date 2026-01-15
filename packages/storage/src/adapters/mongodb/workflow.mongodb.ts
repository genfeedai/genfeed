import type { Model } from 'mongoose';
import type {
  CreateWorkflowData,
  UpdateWorkflowData,
  WorkflowEntity,
} from '../../entities/workflow.entity';
import type { FindOptions } from '../../interfaces/base-repository.interface';
import type { IWorkflowRepository } from '../../interfaces/workflow.repository';

export class WorkflowMongoRepository implements IWorkflowRepository {
  constructor(private workflowModel: Model<unknown>) {}

  async create(data: CreateWorkflowData): Promise<WorkflowEntity> {
    const workflow = new this.workflowModel({
      ...data,
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      groups: data.groups ?? [],
    });
    const saved = await workflow.save();
    return this.mapDocumentToEntity(saved);
  }

  async findById(id: string): Promise<WorkflowEntity | null> {
    const doc = await this.workflowModel.findOne({ _id: id, isDeleted: false }).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findOne(options: FindOptions<WorkflowEntity>): Promise<WorkflowEntity | null> {
    const filter = this.buildFilter(options);
    const doc = await this.workflowModel.findOne(filter).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findAll(options?: FindOptions<WorkflowEntity>): Promise<WorkflowEntity[]> {
    const filter = this.buildFilter(options);
    let query = this.workflowModel.find(filter);

    if (options?.sortBy) {
      const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
      query = query.sort({ [options.sortBy]: sortDirection });
    } else {
      query = query.sort({ updatedAt: -1 });
    }

    if (options?.offset) query = query.skip(options.offset);
    if (options?.limit) query = query.limit(options.limit);

    const docs = await query.exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async findAllActive(options?: FindOptions<WorkflowEntity>): Promise<WorkflowEntity[]> {
    return this.findAll(options);
  }

  async findByName(name: string): Promise<WorkflowEntity | null> {
    return this.findOne({ where: { name } as Partial<WorkflowEntity> });
  }

  async update(id: string, data: UpdateWorkflowData): Promise<WorkflowEntity | null> {
    const doc = await this.workflowModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async softDelete(id: string): Promise<WorkflowEntity | null> {
    const doc = await this.workflowModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.workflowModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async count(options?: FindOptions<WorkflowEntity>): Promise<number> {
    const filter = this.buildFilter(options);
    return this.workflowModel.countDocuments(filter).exec();
  }

  async duplicate(id: string): Promise<WorkflowEntity> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error(`Workflow with ID ${id} not found`);
    }

    return this.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      nodes: original.nodes,
      edges: original.edges,
      edgeStyle: original.edgeStyle,
      groups: original.groups,
    });
  }

  async search(query: string, options?: FindOptions<WorkflowEntity>): Promise<WorkflowEntity[]> {
    const filter = this.buildFilter(options);
    (filter as Record<string, unknown>).$text = { $search: query };

    const docs = await this.workflowModel.find(filter).exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  private buildFilter(options?: FindOptions<WorkflowEntity>): Record<string, unknown> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (options?.where) {
      Object.assign(filter, options.where);
    }

    return filter;
  }

  private mapDocumentToEntity(doc: unknown): WorkflowEntity {
    const d = doc as Record<string, unknown>;
    return {
      id: String(d._id),
      name: d.name as string,
      description: (d.description as string) ?? '',
      version: (d.version as number) ?? 1,
      nodes: (d.nodes as WorkflowEntity['nodes']) ?? [],
      edges: (d.edges as WorkflowEntity['edges']) ?? [],
      edgeStyle: (d.edgeStyle as string) ?? 'smoothstep',
      groups: (d.groups as WorkflowEntity['groups']) ?? [],
      isDeleted: (d.isDeleted as boolean) ?? false,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
    };
  }
}
