import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { InternalToolGuard } from '../common/filters/guards/internal-tool.guard';
import { ProjectsModule } from '../projects/projects.module';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Issue.name, schema: IssueSchema }]),
    ProjectsModule,
    WorkspaceMembersModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService, InternalToolGuard],
})
export class IssuesModule {}
