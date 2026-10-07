import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;
   // Trimmed before validation because ProjectsService checks key uniqueness:
  // without trimming, " WEB" could be stored alongside "WEB" as if they
  // were different keys
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
