import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(Number(id));
  }

  @Get('state')
  state() {
    return this.projectsService.state();
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.projectsService.findByKey(key);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; key?: string },
  ) {
    return this.projectsService.update(Number(id), body);
  }
}
