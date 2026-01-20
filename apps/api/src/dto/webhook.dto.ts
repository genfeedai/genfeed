import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class MetricsDto {
  @IsOptional()
  @IsNumber()
  predict_time?: number;
}

export class WebhookDto {
  @IsString()
  id: string;

  @IsString()
  status: string;

  @IsOptional()
  output?: unknown;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MetricsDto)
  metrics?: MetricsDto;
}
