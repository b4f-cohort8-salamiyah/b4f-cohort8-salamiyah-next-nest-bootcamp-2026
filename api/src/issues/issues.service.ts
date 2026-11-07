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

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly activityService: ActivityService,
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

      return issue;
    });
  }

  async update(id: number, dto: UpdateIssueDto, requestingUserId: number) {
    const issue = await this.findOne(id);
    await this.requireOwnershipOrRole(issue, requestingUserId);

    const saved = await this.prisma.issue.update({
      where: { id },
      data: {
        ...(dto?.title !== undefined ? { title: dto.title } : {}),
        ...(dto?.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto?.status !== undefined ? { status: dto.status } : {}),
      },
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
}
