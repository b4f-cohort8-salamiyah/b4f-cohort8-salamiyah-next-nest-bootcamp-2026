import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { WorkSpaceService } from './workSpace.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workSpaceService: WorkSpaceService) {}

  @Get()
  findAll() {
    return this.workSpaceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workSpaceService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.workSpaceService.update(Number(id), body);
  }
}
