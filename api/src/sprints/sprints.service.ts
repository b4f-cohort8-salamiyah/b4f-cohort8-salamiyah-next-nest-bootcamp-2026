import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { ActivityService } from 'src/activity/activity.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Prisma } from '@prisma/client';

// INSTRUCTOR-PROVIDED PRODUCT SUPPORT (Session 26) -- adapted from final-preview/b4f-board's own
// real, tested Sprint implementation for this backend's integer ids and its own plain validated-
// string status convention (matching `Issue.status`, never a second Prisma enum concept). Real
// rules, same as final-preview's own documented design:
//   1. Creating/starting/completing a sprint is Admin/Owner-only -- the same governance level
//      this app already requires to create a Project.
//   2. At most one ACTIVE sprint per project at a time -- checked here for a friendly response
//      and finally guaranteed by a PostgreSQL partial unique index for concurrent requests.
//   3. A sprint only ever moves planned -> active -> completed, one step at a time, forward
//      only. A completed sprint can never become active again.
//   4. A completed sprint's name/goal can no longer be edited.
//   5. An issue belongs to zero or one sprint (a single nullable FK). Assigning an issue to a
//      sprint from a different project is rejected (see IssuesService.update()).
@Injectable()
export class SprintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async requireAdminOrOwner(projectId: number, userId: number) {
    const project = await this.projectsService.findOne(projectId);
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        project.workspaceId,
        userId,
      );

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      throw new ForbiddenException(
        'Only a workspace Admin or Owner may manage sprints.',
      );
    }

    return project;
  }

  private async getSprintOrThrow(id: number) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!sprint) {
      throw new NotFoundException(`No sprint found with id ${id}.`);
    }

    return sprint;
  }

  private async pointsFor(sprintId: number) {
    const issues = await this.prisma.issue.findMany({
      where: { sprintId },
      select: { storyPoints: true, status: true },
    });

    const totalPoints = issues.reduce(
      (sum, i) => sum + (i.storyPoints ?? 0),
      0,
    );
    const completedPoints = issues
      .filter((i) => i.status === 'done')
      .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

    return {
      issueCount: issues.length,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      completionPercent:
        totalPoints === 0
          ? 0
          : Math.round((completedPoints / totalPoints) * 100),
    };
  }

  async create(projectId: number, userId: number, dto: CreateSprintDto) {
    await this.requireAdminOrOwner(projectId, userId);

    return this.prisma.sprint.create({
      data: {
        projectId,
        name: dto.name,
        goal: dto.goal ?? '',
      },
    });
  }

  async findAllForProject(projectId: number, userId: number) {
    const project = await this.projectsService.findOne(projectId);
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        project.workspaceId,
        userId,
      );

    if (!membership) {
      throw new ForbiddenException(
        `User ${userId} is not a member of workspace ${project.workspaceId}.`,
      );
    }

    const sprints = await this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      sprints.map(async (sprint) => ({
        ...sprint,
        points: await this.pointsFor(sprint.id),
      })),
    );
  }

  async findOne(id: number, userId: number) {
    const sprint = await this.getSprintOrThrow(id);
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        sprint.project.workspaceId,
        userId,
      );

    if (!membership) {
      throw new ForbiddenException(
        `User ${userId} is not a member of workspace ${sprint.project.workspaceId}.`,
      );
    }

    const points = await this.pointsFor(id);
    return { ...sprint, points };
  }

  async update(id: number, userId: number, dto: UpdateSprintDto) {
    const sprint = await this.getSprintOrThrow(id);
    await this.requireAdminOrOwner(sprint.projectId, userId);

    if (sprint.status === 'completed') {
      throw new BadRequestException(
        'A completed sprint can no longer be edited.',
      );
    }

    return this.prisma.sprint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.goal !== undefined ? { goal: dto.goal } : {}),
      },
    });
  }

  async start(id: number, userId: number) {
    const sprint = await this.getSprintOrThrow(id);
    await this.requireAdminOrOwner(sprint.projectId, userId);

    if (sprint.status !== 'planned') {
      throw new BadRequestException('Only a planned sprint can be started.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const alreadyActive = await tx.sprint.findFirst({
          where: { projectId: sprint.projectId, status: 'active' },
        });

        if (alreadyActive) {
          throw new ConflictException(
            `"${alreadyActive.name}" is already the active sprint for this project -- complete it first.`,
          );
        }

        const updated = await tx.sprint.update({
          where: { id },
          data: { status: 'active', startedAt: new Date() },
        });

        await this.activityService.record(
          {
            workspaceId: sprint.project.workspaceId,
            actorId: userId,
            action: 'SPRINT_STARTED',
            metadata: { sprintId: id, sprintName: updated.name },
          },
          tx,
        );

        await this.notificationsService.notifySprintLifecycle(
          {
            actorId: userId,
            type: 'SPRINT_STARTED',
            sprintId: id,
            sprintName: updated.name,
          },
          tx,
        );

        return updated;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Another sprint is already active for this project -- complete it first.',
        );
      }
      throw error;
    }
  }

  async complete(id: number, userId: number) {
    const sprint = await this.getSprintOrThrow(id);
    await this.requireAdminOrOwner(sprint.projectId, userId);

    if (sprint.status !== 'active') {
      throw new BadRequestException('Only the active sprint can be completed.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sprint.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
      });

      await this.activityService.record(
        {
          workspaceId: sprint.project.workspaceId,
          actorId: userId,
          action: 'SPRINT_COMPLETED',
          metadata: { sprintId: id, sprintName: updated.name },
        },
        tx,
      );

      await this.notificationsService.notifySprintLifecycle(
        {
          actorId: userId,
          type: 'SPRINT_COMPLETED',
          sprintId: id,
          sprintName: updated.name,
        },
        tx,
      );

      return updated;
    });
  }
}
