import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Web App ' })
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WEB ' })
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ example: 'Customer UI ' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;
}
