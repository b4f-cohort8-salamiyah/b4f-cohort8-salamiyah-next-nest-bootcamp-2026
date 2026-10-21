import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIssueDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiPropertyOptional({ example: 23, nullable: true })
  @IsOptional()
  @IsInt()
  assigneeId?: number | null;

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
