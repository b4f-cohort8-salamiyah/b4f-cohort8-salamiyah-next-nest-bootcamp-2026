import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    JwtModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InternalToolGuard, JwtAuthGuard],
})
export class WorkspacesModule {}
