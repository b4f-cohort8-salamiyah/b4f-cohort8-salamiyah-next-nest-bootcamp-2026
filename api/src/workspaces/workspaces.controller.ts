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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireWorkspaceRole } from '../common/decorators/require-workspace-role.decorator';
import { AddMemberDto } from '../workspace-members/dto/add-member.dto';
import { UpdateMemberRoleDto } from '../workspace-members/dto/update-member-role.dto';
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
  findBySlug(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @ApiOperation({
    summary:
      "List a workspace's own real members (id/name, never email) -- requires the caller to already be a member",
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'The real member list, each with its own user id/name.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not a member of this workspace.',
  })
  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  findMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.workspacesService.findMembers(id, currentUser.sub);
  }

  @ApiOperation({
    summary:
      'INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- add a real member (requires admin/owner).',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(['admin', 'owner'], 'workspaceParam')
  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMemberDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.workspacesService.addMember(id, currentUser.sub, dto);
  }

  @ApiOperation({
    summary:
      'INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- change a real member role (requires admin/owner; never the owner).',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(['admin', 'owner'], 'workspaceParam')
  @Patch(':id/members/:userId')
  updateMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.workspacesService.updateMemberRole(
      id,
      userId,
      currentUser.sub,
      dto,
    );
  }

  @ApiOperation({
    summary:
      'INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- remove a real member (requires admin/owner; never the owner).',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole(['admin', 'owner'], 'workspaceParam')
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.workspacesService.removeMember(id, userId, currentUser.sub);
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
