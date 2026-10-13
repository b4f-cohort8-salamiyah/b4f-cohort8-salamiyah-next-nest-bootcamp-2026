import { IsOptional, IsString } from 'class-validator';

export class FindWorkspacesQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
