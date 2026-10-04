import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspacesService: WorkspacesService) {}
  @Get()
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(Number(id));
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.workspacesService.update(Number(id), body);
  }
}
