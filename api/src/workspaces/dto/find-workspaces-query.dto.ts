import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindWorkspacesQueryDto {
  @ApiPropertyOptional({ example: 'Web app' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'WEB' })
  @IsOptional()
  @IsString()
  slug?: string;
}
