import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { AdminOrOwnerGuard } from './guards/admin-or-owner.guard';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    WorkspaceMembersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, InternalToolGuard, AdminOrOwnerGuard],
})
export class ProjectsModule {}
