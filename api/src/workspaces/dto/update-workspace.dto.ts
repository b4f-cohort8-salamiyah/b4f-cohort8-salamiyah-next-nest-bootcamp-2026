import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  slug?: string;
}
