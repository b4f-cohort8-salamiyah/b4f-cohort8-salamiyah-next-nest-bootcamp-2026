import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
<<<<<<< HEAD
export class WorkspacesModule {}
=======
export class WorkspacesModule {}
>>>>>>> 62b1a02fa6b759d4f86ed0b7d9cff5c13c3cc355
