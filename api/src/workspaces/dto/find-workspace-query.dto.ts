import { IsOptional, IsString } from 'class-validator';

export class FindWorkspaceQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
