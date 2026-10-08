
import { Transform } from 'class-transformer';

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
