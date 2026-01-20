import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PromptCategory } from '@/schemas/prompt-library-item.schema';

export class StyleSettingsDto {
  @IsOptional()
  @IsString()
  mood?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsString()
  camera?: string;

  @IsOptional()
  @IsString()
  lighting?: string;

  @IsOptional()
  @IsString()
  scene?: string;
}

export class CreatePromptLibraryItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  promptText: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StyleSettingsDto)
  styleSettings?: StyleSettingsDto;

  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @IsOptional()
  @IsString()
  preferredModel?: string;

  @IsOptional()
  @IsEnum(PromptCategory)
  category?: PromptCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
