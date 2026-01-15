import type {
  CreateTemplateData,
  TemplateEntity,
  UpdateTemplateData,
} from '../entities/template.entity';
import type { FindOptions, IBaseRepository } from './base-repository.interface';

export interface ITemplateRepository
  extends IBaseRepository<TemplateEntity, CreateTemplateData, UpdateTemplateData> {
  findByCategory(
    category: string,
    options?: FindOptions<TemplateEntity>
  ): Promise<TemplateEntity[]>;
  findSystemTemplates(): Promise<TemplateEntity[]>;
  upsertSystemTemplate(template: CreateTemplateData): Promise<TemplateEntity>;
}

export const TEMPLATE_REPOSITORY = Symbol('TEMPLATE_REPOSITORY');
