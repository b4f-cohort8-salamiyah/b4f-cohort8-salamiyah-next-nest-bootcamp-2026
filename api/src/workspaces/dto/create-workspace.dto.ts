import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Robotics' })
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'acme-robotics' })
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Internal tools' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
