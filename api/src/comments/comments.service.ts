import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { extractMentionedUserIds } from 'src/common/mentions.util';
import { ActivityService } from 'src/activity/activity.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAllForIssue(issueId: number, requestingUserId: number) {
    const { workspaceId } = await this.resolveIssueWorkspace(issueId);
    await this.requireMembership(workspaceId, requestingUserId);

    return this.prisma.comment.findMany({
      where: { issueId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    issueId: number,
    authorId: number,
    dto: CreateCommentDto,
  ): Promise<{ id: number; body: string; mentionedUserIds: number[] }> {
    const issue = await this.resolveIssueWorkspace(issueId);
    const { workspaceId } = issue;
    await this.requireMembership(workspaceId, authorId);

    // Mentioned ids come from the frontend's own mention picker -- never trusted blindly. Every
    // one must already be a real member of THIS workspace before the comment is created.
    const mentionedUserIds = extractMentionedUserIds(dto.body);
    await this.requireAllMembers(workspaceId, mentionedUserIds);

    // Same real "activity shares the action's own transaction" decision as IssuesService.create()
    // -- a COMMENTED/MENTIONED row can never exist without the real event it describes.
    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { issueId, authorId, body: dto.body },
        include: { author: { select: { id: true, name: true } } },
      });

      await this.activityService.record(
        {
          workspaceId,
          issueId,
          actorId: authorId,
          action: 'COMMENTED',
          metadata: { commentId: created.id },
        },
        tx,
      );

      for (const mentionedUserId of mentionedUserIds) {
        await this.activityService.record(
          {
            workspaceId,
            issueId,
            actorId: authorId,
            action: 'MENTIONED',
            metadata: { commentId: created.id, mentionedUserId },
          },
          tx,
        );
      }

      // Same real transaction again -- notifyMentions() drops the real actor from its own
      // recipient list, so mentioning yourself never notifies yourself.
      const mentioned = await this.notificationsService.notifyMentions(
        {
          actorId: authorId,
          mentionedUserIds,
          issueId,
          commentId: created.id,
          context: 'comment',
        },
        tx,
      );

      await this.notificationsService.notifyComment(
        {
          actorId: authorId,
          reporterId: issue.reporterId,
          assigneeId: issue.assigneeId,
          alreadyNotifiedUserIds: mentioned,
          issueId,
          issueKey: issue.key,
          commentId: created.id,
        },
        tx,
      );

      return created;
    });

    this.logger.log(
      `Created comment ${comment.id} on issue ${issueId} (${mentionedUserIds.length} real mention(s))`,
    );

    return { ...comment, mentionedUserIds };
  }

  async update(
    commentId: number,
    requestingUserId: number,
    dto: CreateCommentDto,
  ) {
    const comment = await this.getCommentOrThrow(commentId);
    await this.requireCanMutate(comment, requestingUserId);
    const mentionedUserIds = extractMentionedUserIds(dto.body);
    await this.requireAllMembers(
      comment.issue.project.workspaceId,
      mentionedUserIds,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { body: dto.body },
        include: { author: { select: { id: true, name: true } } },
      });
      for (const mentionedUserId of mentionedUserIds) {
        await this.activityService.record(
          {
            workspaceId: comment.issue.project.workspaceId,
            issueId: comment.issueId,
            actorId: requestingUserId,
            action: 'MENTIONED',
            metadata: { commentId, mentionedUserId },
          },
          tx,
        );
      }
      await this.notificationsService.notifyMentions(
        {
          actorId: requestingUserId,
          mentionedUserIds,
          issueId: comment.issueId,
          commentId,
          context: 'comment',
        },
        tx,
      );
      return updated;
    });
  }

  async remove(commentId: number, requestingUserId: number) {
    const comment = await this.getCommentOrThrow(commentId);
    await this.requireCanMutate(comment, requestingUserId);
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { deleted: true };
  }

  private async getCommentOrThrow(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { issue: { include: { project: true } } },
    });
    if (!comment) {
      throw new NotFoundException(`No comment found with id ${commentId}.`);
    }
    return comment;
  }

  private async requireCanMutate(
    comment: {
      authorId: number | null;
      issue: { project: { workspaceId: number } };
    },
    requestingUserId: number,
  ) {
    const membership = await this.requireMembership(
      comment.issue.project.workspaceId,
      requestingUserId,
    );
    if (
      comment.authorId !== requestingUserId &&
      !['owner', 'admin'].includes(membership.role)
    ) {
      throw new ForbiddenException(
        'Only the comment author or a workspace Admin/Owner may do this.',
      );
    }
  }

  private async resolveIssueWorkspace(issueId: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      include: { project: true },
    });

    if (!issue) {
      throw new ForbiddenException(`No issue found with id ${issueId}.`);
    }

    // Deliberately `this.prisma.project.findUnique()`, NOT `ProjectsService.findOne()` --
    // `Issue.projectId` is already a real Postgres foreign key (Issues migrated before Projects);
    // going through the still-Mongoose-backed ProjectsService would miss it.
    return {
      issueId,
      workspaceId: issue.project.workspaceId,
      projectId: issue.projectId,
      key: issue.key,
      reporterId: issue.reporterId,
      assigneeId: issue.assigneeId,
    };
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
      const membership =
        await this.workspaceMembersService.findByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      if (!membership) {
        throw new ForbiddenException(
          `Mentioned user ${userId} is not a member of workspace ${workspaceId}.`,
        );
      }
    }
  }
}
