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
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';

const INTERNAL_TOOL_HEADER = {
  name: 'x-internal-tool-key',
  description:
    'Required internal-tool access key (value not published here). This is access control, not authentication -- it does not identify who is calling.',
  required: true,
};

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkSpacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @ApiOperation({
    summary: 'List workspaces, optionally filtered by name or slug',
  })
  @Get()
  findAll(@Query() query: FindWorkspacesQueryDto) {
    return this.workspacesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get one workspace by its id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Post()
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(dto);
  }

  @ApiOperation({ summary: 'Update a workspace' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Get one workspace by its slug' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.remove(id);
  }
}

