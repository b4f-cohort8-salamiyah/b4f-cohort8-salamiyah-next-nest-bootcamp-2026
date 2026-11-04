import { Module } from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';

@Module({
  providers: [WorkspaceMembersService],
  exports: [WorkspaceMembersService],
})
export class WorkspaceMembersModule {}
