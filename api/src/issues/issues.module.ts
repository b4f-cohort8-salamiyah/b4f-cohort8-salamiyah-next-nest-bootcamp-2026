import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
<<<<<<< HEAD
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module'; 
import { ProjectsModule } from '../projects/projects.module'; 
=======
import { ProjectsModule } from 'src/projects/projects.module';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';
>>>>>>> main

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Issue.name, schema: IssueSchema }]),
<<<<<<< HEAD
    WorkspaceMembersModule, 
    ProjectsModule,        
=======
    ProjectsModule,
    WorkspaceMembersModule,
>>>>>>> main
  ],
  controllers: [IssuesController],
  providers: [IssuesService, InternalToolGuard],
})
export class IssuesModule {}