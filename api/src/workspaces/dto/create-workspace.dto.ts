import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @IsString()
  // Trimming 'slug' is critical because it enforces uniqueness and is used in routing.
  // Without trimming, an untrimmed value like " my-team" could coexist with "my-team",
  // breaking unique constraints and causing identifier conflicts.
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
