import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspacesService) {}

  @Get()
  findall() {
    return this.workspaceService.findAll;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; key?: string },
  ) {
    return this.workspaceService.update(Number(id), body);
  }
}
