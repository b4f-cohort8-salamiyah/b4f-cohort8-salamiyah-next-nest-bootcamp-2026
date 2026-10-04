import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
//Added: Make the Workspaces feature available to the application.
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  //Added: Register WorkspacesModule alongside the existing ProjectsModule.
  imports: [ProjectsModule, WorkspacesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
