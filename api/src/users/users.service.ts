import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { SearchUsersDto } from './dto/search-users.dto';

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

const SEARCH_RESULT_LIMIT = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findPublicById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    return this.prisma.user.create({ data });
  }

  // INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 25) -- NOT backend curriculum. Adapted from
  // final-preview/b4f-board/api/src/users/users.service.ts for this backend's integer ids. The
  // Add-Member picker (S25) and the @mention picker (S27) share this one real endpoint rather
  // than each growing its own ad-hoc lookup; `membersOnly` picks the real direction each one
  // needs -- unset excludes existing members (add-member), `true` includes only existing members
  // (@mention, since a non-member can never genuinely be mentioned). `q` has a real
  // server-enforced minimum length (SearchUsersDto) so an empty/near-empty query can never dump
  // the whole real user directory -- this is a closed-cohort teaching app, not a public product.
  async search(requestingUserId: number, dto: SearchUsersDto) {
    let memberIds: number[] = [];
    if (dto.workspaceId !== undefined) {
      const membership =
        await this.workspaceMembersService.findByWorkspaceAndUser(
          dto.workspaceId,
          requestingUserId,
        );
      if (!membership) {
        return [];
      }
      const members = await this.prisma.workspaceMember.findMany({
        where: { workspaceId: dto.workspaceId },
        select: { userId: true },
      });
      memberIds = members.map((m) => m.userId);
    }

    const membershipFilter =
      dto.workspaceId !== undefined
        ? dto.membersOnly === 'true'
          ? { id: { in: memberIds } }
          : { id: { notIn: memberIds } }
        : {};

    return this.prisma.user.findMany({
      where: {
        ...membershipFilter,
        OR: [
          { name: { contains: dto.q, mode: 'insensitive' as const } },
          { email: { contains: dto.q, mode: 'insensitive' as const } },
        ],
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
      take: SEARCH_RESULT_LIMIT,
    });
  }

  myIssues(userId: number) {
    return this.prisma.issue.findMany({
      where: {
        assigneeId: userId,
        project: {
          workspace: {
            members: { some: { userId } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            key: true,
            name: true,
            workspaceId: true,
          },
        },
      },
    });
  }

  async myActivity(userId: number) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const workspaceIds = memberships.map((entry) => entry.workspaceId);
    if (workspaceIds.length === 0) return [];

    return this.prisma.activityLog.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, name: true } },
        issue: { select: { id: true, key: true, title: true } },
        workspace: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  toSafeUser(user: {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
  }): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
