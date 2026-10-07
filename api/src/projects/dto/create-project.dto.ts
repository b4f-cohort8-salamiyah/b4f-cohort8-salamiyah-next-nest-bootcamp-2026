import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  // Trimming the 'key' is critical because the ProjectsService checks it for uniqueness.
  // Without trimming, " KEY" and "KEY" would coexist as if they were different, breaking validation.
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
