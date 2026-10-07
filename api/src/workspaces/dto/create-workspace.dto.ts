import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;
  // Trimming the 'Slug' is critical because the ProjectsService checks it for uniqueness.
  // Without trimming, " Slug" and "Slug" would coexist as if they were different, breaking validation.
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
