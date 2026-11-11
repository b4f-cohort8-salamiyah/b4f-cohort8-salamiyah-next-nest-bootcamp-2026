import { Module } from '@nestjs/common';
import {
  ProjectSprintsController,
  SprintsController,
} from './sprints.controller';
import { SprintsService } from './sprints.service';
import { ProjectsModule } from 'src/projects/projects.module';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { ActivityModule } from 'src/activity/activity.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    ProjectsModule,
    WorkspaceMembersModule,
    ActivityModule,
    NotificationsModule,
  ],
  controllers: [ProjectSprintsController, SprintsController],
  providers: [SprintsService],
  exports: [SprintsService],
})
export class SprintsModule {}
