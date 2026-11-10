import { IsIn, IsInt } from 'class-validator';

export class AddMemberDto {
  @IsInt()
  userId: number;

  @IsIn(['admin', 'member'])
  role: 'admin' | 'member';
}
