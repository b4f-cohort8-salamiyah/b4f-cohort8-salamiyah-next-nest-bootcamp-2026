import { IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsIn(['admin', 'member'])
  role: 'admin' | 'member';
}
