import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { ProjectsModule } from 'src/projects/projects.module';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [ProjectsModule, WorkspaceMembersModule, ActivityModule],
  controllers: [IssuesController],
  providers: [IssuesService, InternalToolGuard],
})
export class IssuesModule {}
