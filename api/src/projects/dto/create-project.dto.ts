import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @IsString()
  // Trimming 'key' is critical because it enforces uniqueness.
  // Without trimming, values like " WEB" and "WEB" would be treated as distinct keys,
  // bypassing duplicate checks and causing conflicting identifiers.
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
