import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';
import { AddMemberDto } from '../workspace-members/dto/add-member.dto';
import { UpdateMemberRoleDto } from '../workspace-members/dto/update-member-role.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: FindWorkspacesQueryDto) {
    return this.prisma.workspace.findMany({
      where: {
        ...(query.name
          ? { name: { contains: query.name, mode: 'insensitive' as const } }
          : {}),
        ...(query.slug ? { slug: query.slug } : {}),
      },
    });
  }

  async findOne(id: number) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    return workspace;
  }

  async create(dto: CreateWorkspaceDto, ownerId: number) {
    const taken = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });

    if (taken) {
      throw new ConflictException(
        `slug "${dto.slug}" is already used by another workspace.`,
      );
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description || '',
        ownerId,
      },
    });

    this.logger.log(`Created workspace ${workspace.id} ("${workspace.name}")`);

    await this.workspaceMembersService.create({
      workspaceId: workspace.id,
      userId: ownerId,
      role: 'owner',
    });

    return workspace;
  }

  async update(id: number, dto: UpdateWorkspaceDto) {
    await this.findOne(id);

    if (dto?.slug !== undefined) {
      const taken = await this.prisma.workspace.findUnique({
        where: { slug: dto.slug },
      });
      if (taken) {
        throw new ConflictException(
          `slug "${dto.slug}" is already used by another workspace.`,
        );
      }
    }

    const saved = await this.prisma.workspace.update({
      where: { id },
      data: {
        ...(dto?.name !== undefined ? { name: dto.name } : {}),
        ...(dto?.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto?.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });

    this.logger.log(`Updated workspace ${saved.id} ("${saved.name}")`);

    return saved;
  }

  async findMembers(workspaceId: number, requestingUserId: number) {
    await this.findOne(workspaceId);

    const requesterIsMember =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        requestingUserId,
      );

    if (!requesterIsMember) {
      throw new ForbiddenException(
        `User ${requestingUserId} is not a member of workspace ${workspaceId}.`,
      );
    }

    return this.workspaceMembersService.findAllForWorkspace(workspaceId);
  }

  // INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- real membership mutation, each real
  // method activity-logged and notification-triggered the identical real pattern IssuesService
  // already established for ISSUE_CREATED (log first, inside the same real sequence; a
  // notification never blocks the real mutation it describes).
  async addMember(workspaceId: number, actorId: number, dto: AddMemberDto) {
    await this.findOne(workspaceId);

    const membership = await this.workspaceMembersService.create({
      workspaceId,
      userId: dto.userId,
      role: dto.role,
    });

    await this.activityService.record({
      workspaceId,
      actorId,
      action: 'MEMBER_ADDED',
      metadata: { userId: dto.userId, role: dto.role },
    });

    await this.notificationsService.notifyMemberAdded({
      actorId,
      recipientId: dto.userId,
      workspaceId,
    });

    return membership;
  }

  async updateMemberRole(
    workspaceId: number,
    targetUserId: number,
    actorId: number,
    dto: UpdateMemberRoleDto,
  ) {
    const membership = await this.workspaceMembersService.updateRole(
      workspaceId,
      targetUserId,
      dto.role,
    );

    await this.activityService.record({
      workspaceId,
      actorId,
      action: 'MEMBER_ROLE_CHANGED',
      metadata: { userId: targetUserId, role: dto.role },
    });

    await this.notificationsService.notifyRoleChanged({
      actorId,
      recipientId: targetUserId,
      newRole: dto.role,
    });

    return membership;
  }

  async removeMember(
    workspaceId: number,
    targetUserId: number,
    actorId: number,
  ) {
    const removed = await this.workspaceMembersService.remove(
      workspaceId,
      targetUserId,
    );

    await this.activityService.record({
      workspaceId,
      actorId,
      action: 'MEMBER_REMOVED',
      metadata: { userId: targetUserId },
    });

    return removed;
  }

  async findBySlug(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException(`No workspace found with slug "${slug}".`);
    }

    return workspace;
  }

  async remove(id: number) {
    await this.findOne(id);

    const deleted = await this.prisma.workspace.delete({ where: { id } });

    this.logger.log(`Deleted workspace ${id} ("${deleted.name}")`);

    return deleted;
  }
}
