
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesService } from './workspaces.service';

import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InternalToolGuard],
})
export class WorkspacesModule {}
