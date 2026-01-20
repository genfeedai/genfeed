import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { CreatePromptLibraryItemDto } from '@/dto/create-prompt-library-item.dto';
import type { QueryPromptLibraryDto } from '@/dto/query-prompt-library.dto';
import {
  PromptLibraryItem,
  type PromptLibraryItemDocument,
} from '@/schemas/prompt-library-item.schema';

@Injectable()
export class PromptLibraryService {
  constructor(
    @InjectModel(PromptLibraryItem.name)
    private readonly promptModel: Model<PromptLibraryItemDocument>
  ) {}

  async create(dto: CreatePromptLibraryItemDto): Promise<PromptLibraryItemDocument> {
    const prompt = new this.promptModel({
      name: dto.name,
      description: dto.description ?? '',
      promptText: dto.promptText,
      styleSettings: dto.styleSettings ?? {},
      aspectRatio: dto.aspectRatio,
      preferredModel: dto.preferredModel,
      category: dto.category,
      tags: dto.tags ?? [],
      isFeatured: dto.isFeatured ?? false,
      thumbnail: dto.thumbnail,
    });
    return prompt.save();
  }

  async findAll(query: QueryPromptLibraryDto): Promise<PromptLibraryItemDocument[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.category) filter.category = query.category;
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const sortField = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return this.promptModel
      .find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(query.offset ?? 0)
      .limit(query.limit ?? 20)
      .exec();
  }

  async findFeatured(limit = 10): Promise<PromptLibraryItemDocument[]> {
    return this.promptModel
      .find({ isDeleted: false, isFeatured: true })
      .sort({ useCount: -1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<PromptLibraryItemDocument> {
    const item = await this.promptModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!item) {
      throw new NotFoundException(`Prompt library item ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    dto: Partial<CreatePromptLibraryItemDto>
  ): Promise<PromptLibraryItemDocument> {
    const item = await this.promptModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: dto }, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Prompt library item ${id} not found`);
    }
    return item;
  }

  async remove(id: string): Promise<PromptLibraryItemDocument> {
    const item = await this.promptModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Prompt library item ${id} not found`);
    }
    return item;
  }

  async incrementUseCount(id: string): Promise<PromptLibraryItemDocument> {
    const item = await this.promptModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { useCount: 1 } }, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Prompt library item ${id} not found`);
    }
    return item;
  }

  async duplicate(id: string): Promise<PromptLibraryItemDocument> {
    const original = await this.findOne(id);
    const duplicate = new this.promptModel({
      name: `${original.name} (copy)`,
      description: original.description,
      promptText: original.promptText,
      styleSettings: original.styleSettings,
      aspectRatio: original.aspectRatio,
      preferredModel: original.preferredModel,
      category: original.category,
      tags: original.tags,
      thumbnail: original.thumbnail,
      isFeatured: false,
      useCount: 0,
    });
    return duplicate.save();
  }
}
