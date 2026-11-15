import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/sprints')
export class ProjectSprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @ApiOperation({
    summary:
      "List a project's own real sprints, each with a real points summary",
  })
  @Get()
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.findAllForProject(projectId, user.sub);
  }

  @ApiOperation({
    summary: 'Create a sprint for this project (Admin/Owner only)',
  })
  @Post()
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintsService.create(projectId, user.sub, dto);
  }
}

@ApiTags('sprints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @ApiOperation({
    summary: 'Get one sprint by its id, with its real points summary',
  })
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.findOne(id, user.sub);
  }

  @ApiOperation({
    summary: 'Update a planned/active sprint (Admin/Owner only)',
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(id, user.sub, dto);
  }

  @ApiOperation({
    summary:
      'Start a planned sprint (Admin/Owner only) -- rejected if another sprint in this project is already active',
  })
  @Post(':id/start')
  start(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.start(id, user.sub);
  }

  @ApiOperation({ summary: 'Complete the active sprint (Admin/Owner only)' })
  @Post(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sprintsService.complete(id, user.sub);
  }
}
