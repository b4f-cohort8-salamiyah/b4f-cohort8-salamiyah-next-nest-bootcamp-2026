import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  // challenge
  // Trim so " WEB" and "WEB" cannot bypass key uniqueness; descriptions need not be unique.
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  // core
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
