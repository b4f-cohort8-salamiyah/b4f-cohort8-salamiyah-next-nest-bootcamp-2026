import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type Client = Prisma.TransactionClient | PrismaService;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: number, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: number) {
    return {
      count: await this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    };
  }

  private async actorName(actorId: number, client: Client) {
    const actor = await client.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });
    return actor?.name ?? 'Someone';
  }

  async notifyMentions(
    input: {
      actorId: number;
      mentionedUserIds: number[];
      issueId: number;
      commentId?: number;
      context: 'comment' | 'description';
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const recipients = input.mentionedUserIds.filter(
      (id) => id !== input.actorId,
    );
    if (recipients.length === 0) return recipients;

    const actorName = await this.actorName(input.actorId, client);
    const location =
      input.context === 'comment' ? 'a comment' : "an issue's description";
    await Promise.all(
      recipients.map((userId) =>
        client.notification.create({
          data: {
            userId,
            type: 'MENTION',
            message: `${actorName} mentioned you in ${location}.`,
            issueId: input.issueId,
            commentId: input.commentId,
            actorId: input.actorId,
          },
        }),
      ),
    );
    return recipients;
  }

  async notifyMemberAdded(
    input: { actorId: number; recipientId: number; workspaceId: number },
    tx?: Prisma.TransactionClient,
  ) {
    if (input.recipientId === input.actorId) return null;
    const client = tx ?? this.prisma;
    const actorName = await this.actorName(input.actorId, client);
    return client.notification.create({
      data: {
        userId: input.recipientId,
        type: 'MEMBER_ADDED',
        message: `${actorName} added you to a workspace.`,
        actorId: input.actorId,
      },
    });
  }

  async notifyRoleChanged(
    input: { actorId: number; recipientId: number; newRole: string },
    tx?: Prisma.TransactionClient,
  ) {
    if (input.recipientId === input.actorId) return null;
    const client = tx ?? this.prisma;
    const actorName = await this.actorName(input.actorId, client);
    return client.notification.create({
      data: {
        userId: input.recipientId,
        type: 'WORKSPACE_ROLE_CHANGED',
        message: `${actorName} changed your role to ${input.newRole}.`,
        actorId: input.actorId,
      },
    });
  }

  async notifyIssueAssigned(
    input: { actorId: number; recipientId: number; issueId: number },
    tx?: Prisma.TransactionClient,
  ) {
    if (input.recipientId === input.actorId) return null;
    const client = tx ?? this.prisma;
    const actorName = await this.actorName(input.actorId, client);
    return client.notification.create({
      data: {
        userId: input.recipientId,
        type: 'ISSUE_ASSIGNED',
        message: `${actorName} assigned an issue to you.`,
        issueId: input.issueId,
        actorId: input.actorId,
      },
    });
  }

  async notifyComment(
    input: {
      actorId: number;
      reporterId: number | null;
      assigneeId: number | null;
      alreadyNotifiedUserIds: number[];
      issueId: number;
      issueKey: string;
      commentId: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const excluded = new Set([input.actorId, ...input.alreadyNotifiedUserIds]);
    const recipients = [
      ...new Set([input.reporterId, input.assigneeId]),
    ].filter((id): id is number => id !== null && !excluded.has(id));
    if (recipients.length === 0) return recipients;

    const actorName = await this.actorName(input.actorId, client);
    await Promise.all(
      recipients.map((userId) =>
        client.notification.create({
          data: {
            userId,
            type: 'COMMENT_ON_REPORTED_OR_ASSIGNED_ISSUE',
            message: `${actorName} commented on ${input.issueKey}.`,
            issueId: input.issueId,
            commentId: input.commentId,
            actorId: input.actorId,
          },
        }),
      ),
    );
    return recipients;
  }

  async notifySprintLifecycle(
    input: {
      actorId: number;
      type: 'SPRINT_STARTED' | 'SPRINT_COMPLETED';
      sprintId: number;
      sprintName: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    const assignees = await tx.issue.findMany({
      where: { sprintId: input.sprintId, assigneeId: { not: null } },
      select: { assigneeId: true },
      distinct: ['assigneeId'],
    });
    const recipients = [
      ...new Set(assignees.map((entry) => entry.assigneeId as number)),
    ].filter((id) => id !== input.actorId);
    const verb = input.type === 'SPRINT_STARTED' ? 'started' : 'completed';

    await Promise.all(
      recipients.map((userId) =>
        tx.notification.create({
          data: {
            userId,
            type: input.type,
            message: `${input.sprintName} ${verb}.`,
            actorId: input.actorId,
          },
        }),
      ),
    );
    return recipients;
  }

  async markRead(notificationId: number, userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        `No notification found with id ${notificationId}.`,
      );
    }
    return { marked: true };
  }

  async markAllRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { marked: result.count };
  }

  async remove(notificationId: number, userId: number) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        `No notification found with id ${notificationId}.`,
      );
    }
    return { deleted: true };
  }
}
