import { IsNotEmpty, IsString } from 'class-validator';

export class SetThumbnailDto {
  @IsString()
  @IsNotEmpty()
  thumbnailUrl: string;

  @IsString()
  @IsNotEmpty()
  nodeId: string;
}
