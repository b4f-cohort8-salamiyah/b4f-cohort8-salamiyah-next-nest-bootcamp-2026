import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [ProjectsModule, WorkspacesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
