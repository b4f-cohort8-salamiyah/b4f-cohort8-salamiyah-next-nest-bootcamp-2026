import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { WorkspaceMembersModule } from 'src/workspace-members/workspace-members.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    WorkspaceMembersModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InternalToolGuard],
})
export class WorkspacesModule {}
