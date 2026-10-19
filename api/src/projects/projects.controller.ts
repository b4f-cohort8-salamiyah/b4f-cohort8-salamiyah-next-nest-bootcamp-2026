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
import { InternalToolGuard } from '../common/filters/guards/internal-tool.guard';
import { JwtAuthGuard } from '../common/filters/guards/jwt-auth.guard';

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

  @ApiOperation({ summary: 'Get the number of projects' })
  @ApiHeader(INTERNAL_TOOL_HEADER)
  @ApiResponse({ status: 200, description: 'Returns the total project count.' })
  @ApiResponse({
    status: 403,
    description: 'Missing or incorrect x-internal-tool-key.',
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
  @UseGuards(JwtAuthGuard)
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
