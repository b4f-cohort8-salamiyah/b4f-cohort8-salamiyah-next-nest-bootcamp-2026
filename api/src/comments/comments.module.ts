import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [WorkspaceMembersModule, ActivityModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
