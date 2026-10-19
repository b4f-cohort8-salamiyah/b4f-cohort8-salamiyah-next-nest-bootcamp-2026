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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { InternalToolGuard } from 'src/common/filters/guards/internal-tool.guard';

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

  @ApiOperation({ summary: 'Create a new project' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Project created successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @ApiOperation({ summary: 'Update a project' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully.',
  })
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

  @ApiOperation({ summary: 'Delete a project' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully.',
  })
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
