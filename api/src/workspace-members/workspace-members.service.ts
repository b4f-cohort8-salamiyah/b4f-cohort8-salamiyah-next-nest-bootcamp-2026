import { ConflictException, Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceMembersService {
  constructor(private readonly prisma: PrismaService) {}

  findByWorkspaceAndUser(workspaceId: number, userId: number) {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  findAllForWorkspace(workspaceId: number) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async create(data: {
    workspaceId: number;
    userId: number;
    role: WorkspaceRole;
  }) {
    const existing = await this.findByWorkspaceAndUser(
      data.workspaceId,
      data.userId,
    );

    if (existing) {
      throw new ConflictException(
        `User ${data.userId} is already a member of workspace ${data.workspaceId}.`,
      );
    }

    return this.prisma.workspaceMember.create({ data });
  }
}
