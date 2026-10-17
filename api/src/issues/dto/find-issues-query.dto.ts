import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

export class FindIssuesQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional({
    example: 'in_progress',
    enum: ['todo', 'in_progress', 'review', 'done'],
  })
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'done'])
  status?: string;
}
