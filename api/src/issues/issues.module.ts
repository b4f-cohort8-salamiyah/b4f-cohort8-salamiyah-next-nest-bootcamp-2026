import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { InternalToolGuard } from '../common/guards/internal-tool.guard';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ProjectsModule, WorkspaceMembersModule, ActivityModule],
  controllers: [IssuesController],
  providers: [IssuesService, InternalToolGuard],
})
export class IssuesModule {}
