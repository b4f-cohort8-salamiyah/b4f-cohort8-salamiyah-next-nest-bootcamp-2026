import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { InternalToolGuard } from '../common/guards/internal-tool.guard';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { ProjectsModule } from '../projects/projects.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    WorkspaceMembersModule,
    ProjectsModule,
    ActivityModule,
    NotificationsModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InternalToolGuard, WorkspaceRoleGuard],
})
export class WorkspacesModule {}
