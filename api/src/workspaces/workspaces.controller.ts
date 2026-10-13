import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindWorkspaceQueryDto } from './dto/find-workspace-query.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  findall(@Query() query: FindWorkspaceQueryDto) {
    return this.workspacesService.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.workspacesService.stats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; key?: string },
  ) {
    return this.workspacesService.update(id, body);
  }

  @Get('slug/:slug')
  findByKey(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.remove(id);
  }
}
