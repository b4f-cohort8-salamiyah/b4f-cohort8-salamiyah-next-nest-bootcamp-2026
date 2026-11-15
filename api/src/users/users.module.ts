import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';

@Module({
  imports: [WorkspaceMembersModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
