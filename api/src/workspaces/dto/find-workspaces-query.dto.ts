import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindWorkspacesQueryDto {
  @ApiPropertyOptional({ example: 'Acme' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'acme-robotics' })
  @IsOptional()
  @IsString()
  slug?: string;
}
