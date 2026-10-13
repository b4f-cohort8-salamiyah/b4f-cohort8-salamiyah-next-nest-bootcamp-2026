import { Module } from '@nestjs/common';
import { WorkspacesController } from './workSpace.controller';
import { WorkSpaceService } from './workSpace.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkSpaceService],
})
export class WorkSpaceModule {}
