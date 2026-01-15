import type { Model } from 'mongoose';
import type {
  CreateTemplateData,
  TemplateEntity,
  UpdateTemplateData,
} from '../../entities/template.entity';
import type { FindOptions } from '../../interfaces/base-repository.interface';
import type { ITemplateRepository } from '../../interfaces/template.repository';

export class TemplateMongoRepository implements ITemplateRepository {
  constructor(private templateModel: Model<unknown>) {}

  async create(data: CreateTemplateData): Promise<TemplateEntity> {
    const template = new this.templateModel({
      ...data,
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      category: data.category ?? 'custom',
      isSystem: data.isSystem ?? false,
    });
    const saved = await template.save();
    return this.mapDocumentToEntity(saved);
  }

  async findById(id: string): Promise<TemplateEntity | null> {
    const doc = await this.templateModel.findOne({ _id: id, isDeleted: false }).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findOne(options: FindOptions<TemplateEntity>): Promise<TemplateEntity | null> {
    const filter = this.buildFilter(options);
    const doc = await this.templateModel.findOne(filter).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findAll(options?: FindOptions<TemplateEntity>): Promise<TemplateEntity[]> {
    const filter = this.buildFilter(options);
    let query = this.templateModel.find(filter);

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

  async findByCategory(
    category: string,
    options?: FindOptions<TemplateEntity>
  ): Promise<TemplateEntity[]> {
    const filter = this.buildFilter(options);
    (filter as Record<string, unknown>).category = category;

    const docs = await this.templateModel.find(filter).exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async findSystemTemplates(): Promise<TemplateEntity[]> {
    const docs = await this.templateModel
      .find({ isSystem: true, isDeleted: false })
      .sort({ name: 1 })
      .exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async upsertSystemTemplate(template: CreateTemplateData): Promise<TemplateEntity> {
    const existing = await this.findOne({
      where: { name: template.name, isSystem: true } as Partial<TemplateEntity>,
    });

    if (existing) {
      const updated = await this.update(existing.id, template);
      if (!updated) throw new Error('Failed to update system template');
      return updated;
    }

    return this.create({ ...template, isSystem: true });
  }

  async update(id: string, data: UpdateTemplateData): Promise<TemplateEntity | null> {
    const doc = await this.templateModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async softDelete(id: string): Promise<TemplateEntity | null> {
    const doc = await this.templateModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.templateModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async count(options?: FindOptions<TemplateEntity>): Promise<number> {
    const filter = this.buildFilter(options);
    return this.templateModel.countDocuments(filter).exec();
  }

  private buildFilter(options?: FindOptions<TemplateEntity>): Record<string, unknown> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (options?.where) {
      Object.assign(filter, options.where);
    }

    return filter;
  }

  private mapDocumentToEntity(doc: unknown): TemplateEntity {
    const d = doc as Record<string, unknown>;
    return {
      id: String(d._id),
      name: d.name as string,
      description: (d.description as string) ?? '',
      category: (d.category as string) ?? 'custom',
      nodes: (d.nodes as TemplateEntity['nodes']) ?? [],
      edges: (d.edges as TemplateEntity['edges']) ?? [],
      thumbnail: (d.thumbnail as string) ?? undefined,
      isSystem: (d.isSystem as boolean) ?? false,
      isDeleted: (d.isDeleted as boolean) ?? false,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
    };
  }
}
