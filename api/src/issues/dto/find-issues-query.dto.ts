import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class FindIssuesQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional({
    example: 'todo',
    enum: ['todo', 'in_progress', 'review', 'done'],
  })
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'done'])
  status?: string;

  @ApiPropertyOptional({ example: 'login' })
  @IsOptional()
  @IsString()
  title?: string;
}
