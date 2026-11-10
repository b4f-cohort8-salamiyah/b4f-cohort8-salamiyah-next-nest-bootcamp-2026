import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q: string;

  // Scopes/filters by this workspace's membership -- the Add-Member picker (S25) wants
  // candidates who are NOT already a member; membersOnly flips that for the @mention picker
  // (S27), which may only suggest someone who already IS a member. Adapted from
  // final-preview/b4f-board/api/src/users/dto/search-users.dto.ts for this backend's integer ids.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  workspaceId?: number;

  @IsOptional()
  @IsIn(['true'])
  membersOnly?: string;
}
