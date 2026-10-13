import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InternalToolGuard],
})
<<<<<<< HEAD
export class WorkspacesModule {}
=======
export class WorkspacesModule {}
>>>>>>> 62b1a02fa6b759d4f86ed0b7d9cff5c13c3cc355
