import type {
  CreatePromptData,
  PromptLibraryItemEntity,
  UpdatePromptData,
} from '../entities/prompt-library.entity';
import type { FindOptions, IBaseRepository } from './base-repository.interface';

export interface PromptQueryOptions extends FindOptions<PromptLibraryItemEntity> {
  category?: string;
  tag?: string;
  search?: string;
}

export interface IPromptLibraryRepository
  extends IBaseRepository<PromptLibraryItemEntity, CreatePromptData, UpdatePromptData> {
  findWithFilters(options: PromptQueryOptions): Promise<PromptLibraryItemEntity[]>;
  findFeatured(limit?: number): Promise<PromptLibraryItemEntity[]>;
  incrementUseCount(id: string): Promise<PromptLibraryItemEntity | null>;
  duplicate(id: string): Promise<PromptLibraryItemEntity>;
}

export const PROMPT_LIBRARY_REPOSITORY = Symbol('PROMPT_LIBRARY_REPOSITORY');
