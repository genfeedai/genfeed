import type { Model } from 'mongoose';
import type {
  CreatePromptData,
  PromptLibraryItemEntity,
  UpdatePromptData,
} from '../../entities/prompt-library.entity';
import type { FindOptions } from '../../interfaces/base-repository.interface';
import type {
  IPromptLibraryRepository,
  PromptQueryOptions,
} from '../../interfaces/prompt-library.repository';

export class PromptLibraryMongoRepository implements IPromptLibraryRepository {
  constructor(private promptModel: Model<unknown>) {}

  async create(data: CreatePromptData): Promise<PromptLibraryItemEntity> {
    const prompt = new this.promptModel({
      ...data,
      styleSettings: data.styleSettings ?? {},
      aspectRatio: data.aspectRatio ?? '1:1',
      category: data.category ?? 'general',
      tags: data.tags ?? [],
      useCount: 0,
      isFeatured: data.isFeatured ?? false,
    });
    const saved = await prompt.save();
    return this.mapDocumentToEntity(saved);
  }

  async findById(id: string): Promise<PromptLibraryItemEntity | null> {
    const doc = await this.promptModel.findOne({ _id: id, isDeleted: false }).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findOne(
    options: FindOptions<PromptLibraryItemEntity>
  ): Promise<PromptLibraryItemEntity | null> {
    const filter = this.buildFilter(options);
    const doc = await this.promptModel.findOne(filter).exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async findAll(
    options?: FindOptions<PromptLibraryItemEntity>
  ): Promise<PromptLibraryItemEntity[]> {
    const filter = this.buildFilter(options);
    let query = this.promptModel.find(filter);

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

  async findWithFilters(options: PromptQueryOptions): Promise<PromptLibraryItemEntity[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (options.category) {
      filter.category = options.category;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
        { promptText: { $regex: options.search, $options: 'i' } },
      ];
    }

    if (options.tag) {
      filter.tags = options.tag;
    }

    let query = this.promptModel.find(filter);

    if (options.sortBy) {
      const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
      query = query.sort({ [options.sortBy]: sortDirection });
    } else {
      query = query.sort({ updatedAt: -1 });
    }

    if (options.offset) query = query.skip(options.offset);
    if (options.limit) query = query.limit(options.limit);

    const docs = await query.exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async findFeatured(limit = 10): Promise<PromptLibraryItemEntity[]> {
    const docs = await this.promptModel
      .find({ isFeatured: true, isDeleted: false })
      .sort({ useCount: -1 })
      .limit(limit)
      .exec();
    return docs.map((doc) => this.mapDocumentToEntity(doc));
  }

  async incrementUseCount(id: string): Promise<PromptLibraryItemEntity | null> {
    const doc = await this.promptModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { useCount: 1 } }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async duplicate(id: string): Promise<PromptLibraryItemEntity> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error(`Prompt with ID ${id} not found`);
    }

    return this.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      promptText: original.promptText,
      styleSettings: original.styleSettings,
      aspectRatio: original.aspectRatio,
      preferredModel: original.preferredModel,
      category: original.category,
      tags: original.tags,
      isFeatured: false,
      thumbnail: original.thumbnail,
    });
  }

  async update(id: string, data: UpdatePromptData): Promise<PromptLibraryItemEntity | null> {
    const doc = await this.promptModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async softDelete(id: string): Promise<PromptLibraryItemEntity | null> {
    const doc = await this.promptModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();
    return doc ? this.mapDocumentToEntity(doc) : null;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.promptModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async count(options?: FindOptions<PromptLibraryItemEntity>): Promise<number> {
    const filter = this.buildFilter(options);
    return this.promptModel.countDocuments(filter).exec();
  }

  private buildFilter(options?: FindOptions<PromptLibraryItemEntity>): Record<string, unknown> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (options?.where) {
      Object.assign(filter, options.where);
    }

    return filter;
  }

  private mapDocumentToEntity(doc: unknown): PromptLibraryItemEntity {
    const d = doc as Record<string, unknown>;
    return {
      id: String(d._id),
      name: d.name as string,
      description: (d.description as string) ?? '',
      promptText: d.promptText as string,
      styleSettings: (d.styleSettings as PromptLibraryItemEntity['styleSettings']) ?? {},
      aspectRatio: (d.aspectRatio as string) ?? '1:1',
      preferredModel: (d.preferredModel as string) ?? undefined,
      category: (d.category as string) ?? 'general',
      tags: (d.tags as string[]) ?? [],
      useCount: (d.useCount as number) ?? 0,
      isFeatured: (d.isFeatured as boolean) ?? false,
      thumbnail: (d.thumbnail as string) ?? undefined,
      isDeleted: (d.isDeleted as boolean) ?? false,
      createdAt: d.createdAt as Date,
      updatedAt: d.updatedAt as Date,
    };
  }
}
