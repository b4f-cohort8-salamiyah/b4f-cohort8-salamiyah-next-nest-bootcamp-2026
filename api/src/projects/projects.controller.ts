/*
 * Because it only checks if the request possesses the required secret key to proceed (access control), but it does not verify the identity of the specific user making the request (authentication).
 *
 * Because it centralizes the security logic in one place. This prevents human errors (like forgetting the check on a new route) and separates the security concern from the core business logic of the controller.
 *
 * The system will transition to verifying individual user identities and their specific roles/permissions using unique tokens, rather than relying on a single, static global secret key for all requests.
 */
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
import { ProjectsService } from './projects.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InternalToolGuard } from '../common/filters/guards/internal-tool.guard';

const INTERNAL_TOOL_HEADER = {
  name: 'x-internal-tool-key',
  description:
    'Required internal-tool access key (value not published here). This is access control, not authentication -- it does not identify who is calling.',
  required: true,
};

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Get all projects' })
  @Get()
  findAll(@Query() query: FindProjectsQueryDto) {
    return this.projectsService.findAll(query);
  }

  @ApiOperation({
    summary: 'Count how many projects exist (internal tool only)',
  })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @ApiResponse({
    status: 200,
    description: 'Successfully returned the total count of projects.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseGuards(InternalToolGuard)
  @Get('stats')
  stats() {
    return this.projectsService.stats();
  }

  @ApiOperation({ summary: 'Find a project by its id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new project' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a project' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Get one project by its key' })
  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.projectsService.findByKey(key);
  }

  @ApiOperation({ summary: 'Delete a project' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @UseGuards(InternalToolGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
