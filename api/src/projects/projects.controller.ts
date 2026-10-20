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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { AdminOrOwnerGuard } from './guards/admin-or-owner.guard';

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

  // This endpoint deliberately keeps InternalToolGuard because it is an internal tooling stats endpoint,
  // not a user-authenticated write action. JwtAuthGuard answers "is this a valid signed-in user?";
  // InternalToolGuard answers "does this request carry the shared backend key?". They solve different problems.
  @ApiOperation({
    summary: 'Count how many projects exist (internal tool only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project count returned successfully.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden. The x-internal-tool-key header is missing or invalid.',
  })
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

  @ApiOperation({ summary: 'Create a new project (requires a signed-in user)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'The created project.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Not a member of this workspace, or not Owner/Admin.',
  })
  @UseGuards(JwtAuthGuard, AdminOrOwnerGuard)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a project (requires a signed-in user)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The updated project.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Get one project by its key' })
  @Get('key/:key')
  findByKey(@Param('key') key: string) {
    return this.projectsService.findByKey(key);
  }

  @ApiOperation({ summary: 'Delete a project (requires a signed-in user)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The deleted project.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.remove(id);
  }
}
