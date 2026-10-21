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
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/filters/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { WorkspaceRoleGuard } from 'src/common/filters/guards/workspace-role.guard';
import { RequireWorkspaceRole } from 'src/common/decorators/require-workspace-role.decorator';
@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
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

  @ApiOperation({
    summary: 'Create a new workspace (requires a signed-in user)',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'The created workspace.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.workspacesService.create(dto, currentUser.sub);
  }

  @ApiOperation({ summary: 'Update a workspace (requires a signed-in user)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The updated workspace.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(['admin', 'owner'], 'workspaceParam')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Get one workspace by its slug' })
  @Get('slug/:slug')
  findByKey(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Delete a workspace (requires a signed-in user)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'The deleted workspace.' })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(['owner'], 'workspaceParam')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workspacesService.remove(id);
  }
}
