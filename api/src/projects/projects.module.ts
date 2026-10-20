import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { InternalToolGuard } from '../common/filters/guards/internal-tool.guard';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspaceRoleGuard } from '../common/filters/guards/workspace-role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    WorkspaceMembersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, InternalToolGuard, WorkspaceRoleGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
