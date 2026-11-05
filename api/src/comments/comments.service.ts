import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { extractMentionedUserIds } from '../common/mentions.util';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly activityService: ActivityService,
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
    const { workspaceId } = await this.resolveIssueWorkspace(issueId);
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

      return created;
    });

    this.logger.log(
      `Created comment ${comment.id} on issue ${issueId} (${mentionedUserIds.length} real mention(s))`,
    );

    return { ...comment, mentionedUserIds };
  }

  private async resolveIssueWorkspace(issueId: number) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new ForbiddenException(`No issue found with id ${issueId}.`);
    }

    // Deliberately `this.prisma.project.findUnique()`, NOT `ProjectsService.findOne()` --
    // `Issue.projectId` is already a real Postgres foreign key (Issues migrated before Projects);
    // going through the still-Mongoose-backed ProjectsService would miss it.
    const project = await this.prisma.project.findUnique({
      where: { id: issue.projectId },
    });

    if (!project) {
      throw new ForbiddenException(
        `No project found with id ${issue.projectId}.`,
      );
    }

    return { issueId, workspaceId: project.workspaceId };
  }

  private async requireMembership(workspaceId: number, userId: number) {
    const membership = await this.workspaceMembersService.findByWorkspaceAndUser(
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
      const membership = await this.workspaceMembersService.findByWorkspaceAndUser(
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
