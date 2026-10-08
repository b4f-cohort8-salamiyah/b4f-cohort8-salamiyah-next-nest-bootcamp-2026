import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  // Trimming the 'key' is critical because the ProjectsService checks it for uniqueness.
  // Without trimming, " KEY" and "KEY" would coexist as if they were different, breaking validation.
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
