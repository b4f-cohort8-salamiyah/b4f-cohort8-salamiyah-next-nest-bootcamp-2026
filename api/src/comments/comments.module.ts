import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { ActivityModule } from 'src/activity/activity.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [WorkspaceMembersModule, ActivityModule, NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
