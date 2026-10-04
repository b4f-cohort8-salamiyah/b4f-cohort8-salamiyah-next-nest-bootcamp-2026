import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
