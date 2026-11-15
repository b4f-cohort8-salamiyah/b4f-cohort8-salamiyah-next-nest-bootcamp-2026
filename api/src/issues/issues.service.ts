import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FindIssuesQueryDto } from './dto/find-issues-query.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ProjectsService } from 'src/projects/projects.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityService } from 'src/activity/activity.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { extractMentionedUserIds } from 'src/common/mentions.util';

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(query: FindIssuesQueryDto) {
    return this.prisma.issue.findMany({
      where: {
        ...(query.projectId !== undefined
          ? { projectId: query.projectId }
          : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
        ...(query.title
          ? { title: { contains: query.title, mode: 'insensitive' as const } }
          : {}),
      },
    });
  }

  async findOne(id: number) {
    const issue = await this.prisma.issue.findUnique({ where: { id } });

    if (!issue) {
      throw new NotFoundException(`No issue found with id ${id}.`);
    }

    return issue;
  }

  async create(dto: CreateIssueDto, reporterId: number) {
    const project = await this.projectsService.findOne(dto.projectId);
    await this.requireMembership(project.workspaceId, reporterId);

    if (dto.assigneeId !== undefined) {
      await this.requireMembership(project.workspaceId, dto.assigneeId);
    }
    if (dto.sprintId !== undefined && dto.sprintId !== null) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });
      if (!sprint || sprint.projectId !== dto.projectId) {
        throw new ForbiddenException(
          "That sprint does not belong to this issue's own project.",
        );
      }
    }
    const mentionedUserIds = extractMentionedUserIds(dto.description ?? '');
    await this.requireAllMembers(project.workspaceId, mentionedUserIds);

    // The exact real atomic transaction PrismaService.createIssueWithKey() first proved as a
    // Session 20 sandbox demonstration -- promoted here, for real, into the actual production
    // create path, now carrying every real field this resource's own DTO actually needs
    // (description, assigneeId, the real authenticated reporterId) that the bare sandbox proof
    // never had to.
    return this.prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id: dto.projectId },
        data: { issueSeq: { increment: 1 } },
      });

      const issue = await tx.issue.create({
        data: {
          projectId: dto.projectId,
          key: `${updatedProject.key}-${updatedProject.issueSeq}`,
          title: dto.title,
          description: dto.description || '',
          assigneeId: dto.assigneeId,
          priority: dto.priority,
          storyPoints: dto.storyPoints,
          sprintId: dto.sprintId,
          reporterId,
          status: 'todo',
        },
      });

      this.logger.log(`Created issue ${issue.id} ("${issue.title}")`);

      // Real activity logging, atomic with the issue it describes (the same real transaction,
      // via the shared `tx` client) -- an ISSUE_CREATED row can never exist without its own real
      // issue, and vice versa. See ActivityService.record()'s own real design note.
      await this.activityService.record(
        {
          workspaceId: project.workspaceId,
          issueId: issue.id,
          actorId: reporterId,
          action: 'ISSUE_CREATED',
          metadata: { title: issue.title, key: issue.key },
        },
        tx,
      );

      for (const mentionedUserId of mentionedUserIds) {
        await this.activityService.record(
          {
            workspaceId: project.workspaceId,
            issueId: issue.id,
            actorId: reporterId,
            action: 'MENTIONED',
            metadata: { mentionedUserId, context: 'description' },
          },
          tx,
        );
      }
      await this.notificationsService.notifyMentions(
        {
          actorId: reporterId,
          mentionedUserIds,
          issueId: issue.id,
          context: 'description',
        },
        tx,
      );
      if (dto.assigneeId !== undefined) {
        await this.notificationsService.notifyIssueAssigned(
          {
            actorId: reporterId,
            recipientId: dto.assigneeId,
            issueId: issue.id,
          },
          tx,
        );
      }

      return issue;
    });
  }

  async update(id: number, dto: UpdateIssueDto, requestingUserId: number) {
    const issue = await this.findOne(id);
    await this.requireOwnershipOrRole(issue, requestingUserId);
    const project = await this.projectsService.findOne(issue.projectId);

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.requireMembership(project.workspaceId, dto.assigneeId);
    }

    if (dto.sprintId !== undefined && dto.sprintId !== null) {
      // A sprint only ever makes sense for issues in its own project -- see SprintsService's
      // own documented rules.
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });
      if (!sprint || sprint.projectId !== issue.projectId) {
        throw new ForbiddenException(
          "That sprint does not belong to this issue's own project.",
        );
      }
    }

    const mentionedUserIds =
      dto.description !== undefined
        ? extractMentionedUserIds(dto.description)
        : [];
    await this.requireAllMembers(project.workspaceId, mentionedUserIds);

    const statusChanged =
      dto.status !== undefined && dto.status !== issue.status;
    const assigneeChanged =
      dto.assigneeId !== undefined && dto.assigneeId !== issue.assigneeId;
    const otherFieldChanged =
      (dto.title !== undefined && dto.title !== issue.title) ||
      (dto.description !== undefined &&
        dto.description !== issue.description) ||
      (dto.priority !== undefined && dto.priority !== issue.priority) ||
      (dto.storyPoints !== undefined &&
        dto.storyPoints !== issue.storyPoints) ||
      (dto.sprintId !== undefined && dto.sprintId !== issue.sprintId);

    const saved = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.issue.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
          ...(dto.storyPoints !== undefined
            ? { storyPoints: dto.storyPoints }
            : {}),
          ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId } : {}),
          ...(dto.assigneeId !== undefined
            ? { assigneeId: dto.assigneeId }
            : {}),
        },
      });

      // Each real tracked change gets its own real activity entry -- a single PATCH changing
      // BOTH status and assignee must record both, never only the first `if` that happened to
      // match. A change to neither (e.g. only priority/story points/sprint) still falls back to
      // one generic ISSUE_UPDATED, so no real edit is ever silently unlogged.
      if (statusChanged) {
        await this.activityService.record(
          {
            workspaceId: project.workspaceId,
            issueId: id,
            actorId: requestingUserId,
            action: 'STATUS_CHANGED',
            metadata: { from: issue.status, to: dto.status },
          },
          tx,
        );
      }
      if (assigneeChanged) {
        await this.activityService.record(
          {
            workspaceId: project.workspaceId,
            issueId: id,
            actorId: requestingUserId,
            action: 'ASSIGNED',
            metadata: { from: issue.assigneeId, to: dto.assigneeId },
          },
          tx,
        );
      }
      if (!statusChanged && !assigneeChanged && otherFieldChanged) {
        await this.activityService.record(
          {
            workspaceId: project.workspaceId,
            issueId: id,
            actorId: requestingUserId,
            action: 'ISSUE_UPDATED',
            metadata: {},
          },
          tx,
        );
      }

      for (const mentionedUserId of mentionedUserIds) {
        await this.activityService.record(
          {
            workspaceId: project.workspaceId,
            issueId: id,
            actorId: requestingUserId,
            action: 'MENTIONED',
            metadata: { mentionedUserId, context: 'description' },
          },
          tx,
        );
      }
      await this.notificationsService.notifyMentions(
        {
          actorId: requestingUserId,
          mentionedUserIds,
          issueId: id,
          context: 'description',
        },
        tx,
      );

      if (assigneeChanged && dto.assigneeId) {
        await this.notificationsService.notifyIssueAssigned(
          {
            actorId: requestingUserId,
            recipientId: dto.assigneeId,
            issueId: id,
          },
          tx,
        );
      }

      return updated;
    });

    this.logger.log(`Updated issue ${saved.id} ("${saved.title}")`);

    return saved;
  }

  async remove(id: number, requestingUserId: number) {
    const issue = await this.findOne(id);
    await this.requireOwnershipOrRole(issue, requestingUserId);

    const deleted = await this.prisma.issue.delete({ where: { id } });

    this.logger.log(`Deleted issue ${id} ("${deleted.title}")`);

    return deleted;
  }

  private async requireOwnershipOrRole(
    issue: {
      projectId: number;
      reporterId: number | null;
      assigneeId: number | null;
    },
    requestingUserId: number,
  ): Promise<void> {
    if (
      issue.reporterId === requestingUserId ||
      issue.assigneeId === requestingUserId
    ) {
      return;
    }

    const project = await this.projectsService.findOne(issue.projectId);
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        project.workspaceId,
        requestingUserId,
      );

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      throw new ForbiddenException(
        "Only this issue's assignee, its reporter, or a workspace Admin/Owner may do this.",
      );
    }
  }

  private async requireMembership(workspaceId: number, userId: number) {
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        userId,
      );

    if (!membership) {
      throw new ForbiddenException(
        `User ${userId} is not a member of workspace ${workspaceId}.`,
      );
    }

    return membership;
  }

  private async requireAllMembers(workspaceId: number, userIds: number[]) {
    for (const userId of userIds) {
      await this.requireMembership(workspaceId, userId);
    }
  }
}
