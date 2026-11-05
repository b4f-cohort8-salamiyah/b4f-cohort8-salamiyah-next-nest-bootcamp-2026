import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { InternalToolGuard } from '../common/filters/guards/internal-tool.guard';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspaceRoleGuard } from '../common/filters/guards/workspace-role.guard';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [WorkspaceMembersModule, ProjectsModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InternalToolGuard, WorkspaceRoleGuard],
})
export class WorkspacesModule {}
