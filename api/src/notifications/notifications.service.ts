import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

export interface NotifyMentionsInput {
  actorId: number;
  mentionedUserIds: number[];
  issueId: number;
  commentId: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  findAllForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // RECIPIENT-specific (unlike the shared ActivityLog feed) and must NEVER notify the real actor
  // about their own action -- a real author who mentions themselves gets no notification.
  async notifyMentions(
    input: NotifyMentionsInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const recipients = input.mentionedUserIds.filter(
      (id) => id !== input.actorId,
    );

    if (recipients.length === 0) {
      return [];
    }

    const actor = await this.usersService.findPublicById(input.actorId);
    const actorName = actor?.name ?? 'Someone';

    return Promise.all(
      recipients.map((userId) =>
        client.notification.create({
          data: {
            userId,
            type: 'MENTION',
            message: `${actorName} mentioned you in a comment.`,
            issueId: input.issueId,
            commentId: input.commentId,
            actorId: input.actorId,
          },
        }),
      ),
    );
  }

  async markRead(notificationId: number, requestingUserId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `No notification found with id ${notificationId}.`,
      );
    }

    // A notification is a personal inbox, never a shared resource -- only its own real
    // recipient may read or mutate it, not even a workspace admin/owner.
    if (notification.userId !== requestingUserId) {
      throw new ForbiddenException(
        'Only the real recipient of a notification may mark it read.',
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }
}
