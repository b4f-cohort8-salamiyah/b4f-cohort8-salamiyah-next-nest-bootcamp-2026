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
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly prisma: PrismaService,
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
