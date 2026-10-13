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
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  findAll(@Query() query: FindWorkspacesQueryDto) {
    return this.workspacesService.findAll(query);
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
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, dto);
<<<<<<< HEAD
=======
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.remove(id);
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.remove(id);
  }
}
