import { IsOptional, IsString } from 'class-validator';

export class FindProjectsQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  key?: string;
}
