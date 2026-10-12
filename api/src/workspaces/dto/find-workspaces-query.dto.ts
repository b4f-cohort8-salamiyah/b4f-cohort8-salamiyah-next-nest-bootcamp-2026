import { IsOptional, IsString } from 'class-validator';

export class FindWorkSpaceQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
