import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateIssueDto } from './create-issue.dto';

export class UpdateIssueDto extends PartialType(CreateIssueDto) {
  @ApiPropertyOptional({
    example: 'in_progress',
    enum: ['todo', 'in_progress', 'review', 'done'],
  })
  @IsOptional()
  @IsIn(['todo', 'in_progress', 'review', 'done'])
  status?: string;
}
