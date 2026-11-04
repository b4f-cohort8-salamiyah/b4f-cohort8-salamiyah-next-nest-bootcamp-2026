import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { WorkspaceRoleGuard } from 'src/common/filters/guards/workspace-role.guard';

@Module({
  imports: [WorkspaceMembersModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, InternalToolGuard, WorkspaceRoleGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
