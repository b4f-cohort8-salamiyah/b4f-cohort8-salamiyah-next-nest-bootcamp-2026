import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    JwtModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, InternalToolGuard, JwtAuthGuard],
})
export class ProjectsModule {}
