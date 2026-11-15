import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

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

  // INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- never the OWNER demoted, enforced here,
  // not only at the UI layer (the real, disclosed Workspace Settings requirement).
  async updateRole(workspaceId: number, userId: number, role: WorkspaceRole) {
    await this.requireOwnerIdDoesNotMatch(
      workspaceId,
      userId,
      'change the role of',
    );

    const membership = await this.findByWorkspaceAndUser(workspaceId, userId);
    if (!membership) {
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspaceId}.`,
      );
    }

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  // INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- never the OWNER removed, enforced here.
  async remove(workspaceId: number, userId: number) {
    await this.requireOwnerIdDoesNotMatch(workspaceId, userId, 'remove');

    const membership = await this.findByWorkspaceAndUser(workspaceId, userId);
    if (!membership) {
      throw new NotFoundException(
        `User ${userId} is not a member of workspace ${workspaceId}.`,
      );
    }

    return this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  private async requireOwnerIdDoesNotMatch(
    workspaceId: number,
    userId: number,
    verb: string,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${workspaceId}.`);
    }

    if (workspace.ownerId === userId) {
      throw new ForbiddenException(`Cannot ${verb} the workspace owner.`);
    }
  }
}
