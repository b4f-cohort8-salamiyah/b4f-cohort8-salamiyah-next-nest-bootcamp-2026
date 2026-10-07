import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  // challenge
  // Trim so padded slugs cannot bypass slug uniqueness; descriptions need not be unique.
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  slug: string;

  // stretch
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
