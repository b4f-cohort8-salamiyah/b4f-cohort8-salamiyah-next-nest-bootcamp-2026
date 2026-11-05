import { ForbiddenException, Injectable } from '@nestjs/common';
import { ActivityAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';

export interface RecordActivityInput {
  workspaceId: number;
  issueId?: number;
  actorId?: number | null;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  // Accepts an OPTIONAL real transaction client (`tx`) -- an activity row must never exist
  // independently of the real event it describes. Omit `tx` for call sites with no surrounding
  // transaction of their own.
  record(input: RecordActivityInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return client.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        issueId: input.issueId,
        actorId: input.actorId ?? null,
        action: input.action,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findAllForWorkspace(workspaceId: number, requestingUserId: number) {
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        requestingUserId,
      );

    if (!membership) {
      throw new ForbiddenException(
        `User ${requestingUserId} is not a member of workspace ${workspaceId}.`,
      );
    }

    return this.prisma.activityLog.findMany({
      where: { workspaceId },
      include: { actor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
