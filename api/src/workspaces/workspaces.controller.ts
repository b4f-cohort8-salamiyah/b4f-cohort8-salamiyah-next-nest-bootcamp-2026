//Added: Route workspace HTTP requests to the service using constructor injection.
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  //Added: GET /workspaces
  @Get()
  findAll() {
    return this.workspacesService.findAll();
  }

  //Added: GET /workspaces/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(Number(id));
  }

  //Added: PATCH /workspaces/:id; the service owns validation and mutation.
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; description?: string },
  ) {
    return this.workspacesService.update(Number(id), body);
  }
}
