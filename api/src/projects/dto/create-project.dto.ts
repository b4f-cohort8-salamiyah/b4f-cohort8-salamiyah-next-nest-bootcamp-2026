import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;
  // The key must be unique. If we don't trim it, " WEB" and "WEB" look
  // different, but they are the same key.
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
