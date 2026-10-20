import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 1,
    description: 'The workspace this project belongs to.',
  })
  @IsInt()
  workspaceId: number;

  @ApiProperty({ example: 'Web App ' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WEB ' })
  @IsString()
  // Trimming 'key' is critical because it enforces uniqueness.
  // Without trimming, values like " WEB" and "WEB" would be treated as distinct keys,
  // bypassing duplicate checks and causing conflicting identifiers.
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ example: 'Customer UI ' })
  @IsOptional()
  @IsString()
  description?: string;
}
