import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIssueDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      "Must already be a member of this issue's own workspace. reporterId is never client-supplied -- it is always the authenticated creator.",
  })
  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @ApiProperty({ example: 'Fix the login button' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'It does not respond on mobile Safari' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
