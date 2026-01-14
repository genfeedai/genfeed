import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { FilterQuery, Model, SortOrder } from 'mongoose';
import type { CreatePromptLibraryItemDto } from './dto/create-prompt-library-item.dto';
import type { QueryPromptLibraryDto } from './dto/query-prompt-library.dto';
import {
  PromptLibraryItem,
  type PromptLibraryItemDocument,
} from './schemas/prompt-library-item.schema';

@Injectable()
export class PromptLibraryService {
  constructor(
    @InjectModel(PromptLibraryItem.name)
    private promptLibraryModel: Model<PromptLibraryItemDocument>
  ) {}

  async create(createDto: CreatePromptLibraryItemDto): Promise<PromptLibraryItem> {
    const promptItem = new this.promptLibraryModel({
      ...createDto,
      styleSettings: createDto.styleSettings ?? {},
      tags: createDto.tags ?? [],
    });
    return promptItem.save();
  }

  async findAll(query: QueryPromptLibraryDto): Promise<PromptLibraryItem[]> {
    const filter: FilterQuery<PromptLibraryItemDocument> = { isDeleted: false };

    // Category filter
    if (query.category) {
      filter.category = query.category;
    }

    // Tag filter
    if (query.tag) {
      filter.tags = query.tag;
    }

    // Text search
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Sort configuration
    const sortField = query.sortBy ?? 'createdAt';
    const sortDirection: SortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, SortOrder> = { [sortField]: sortDirection };

    return this.promptLibraryModel
      .find(filter)
      .sort(sort)
      .skip(query.offset ?? 0)
      .limit(query.limit ?? 20)
      .exec();
  }

  async findFeatured(limit = 10): Promise<PromptLibraryItem[]> {
    return this.promptLibraryModel
      .find({ isFeatured: true, isDeleted: false })
      .sort({ useCount: -1 })
      .limit(limit)
      .exec();
  }

  async findOne(id: string): Promise<PromptLibraryItem> {
    const item = await this.promptLibraryModel.findOne({ _id: id, isDeleted: false }).exec();

    if (!item) {
      throw new NotFoundException(`Prompt library item with ID ${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    updateDto: Partial<CreatePromptLibraryItemDto>
  ): Promise<PromptLibraryItem> {
    const item = await this.promptLibraryModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateDto }, { new: true })
      .exec();

    if (!item) {
      throw new NotFoundException(`Prompt library item with ID ${id} not found`);
    }

    return item;
  }

  async remove(id: string): Promise<PromptLibraryItem> {
    const item = await this.promptLibraryModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true })
      .exec();

    if (!item) {
      throw new NotFoundException(`Prompt library item with ID ${id} not found`);
    }

    return item;
  }

  async incrementUseCount(id: string): Promise<PromptLibraryItem> {
    const item = await this.promptLibraryModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { useCount: 1 } }, { new: true })
      .exec();

    if (!item) {
      throw new NotFoundException(`Prompt library item with ID ${id} not found`);
    }

    return item;
  }

  async duplicate(id: string): Promise<PromptLibraryItem> {
    const original = await this.findOne(id);

    const duplicateData: CreatePromptLibraryItemDto = {
      name: `${original.name} (Copy)`,
      description: original.description,
      promptText: original.promptText,
      styleSettings: original.styleSettings,
      aspectRatio: original.aspectRatio,
      preferredModel: original.preferredModel,
      category: original.category,
      tags: [...original.tags],
    };

    return this.create(duplicateData);
  }
}
