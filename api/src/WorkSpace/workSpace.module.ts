import { Module } from '@nestjs/common';
import { ProjectsController } from './workSpace.controller';
import { WorkSpaceService } from './workSpace.service';

@Module({
  controllers: [ProjectsController],
  providers: [WorkSpaceService],
})
export class ProjectsModule {}
