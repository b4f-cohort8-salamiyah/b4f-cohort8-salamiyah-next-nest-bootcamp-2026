import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue, IssueDocument } from './schemas/issue.schema';
import { FindIssuesQueryDto } from './dto/find-issues-query.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ProjectsService } from '../projects/projects.service';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @InjectModel(Issue.name)
    private readonly model: Model<IssueDocument>,
    private readonly projectsService: ProjectsService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  async findAll(query: FindIssuesQueryDto): Promise<IssueDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.projectId !== undefined) {
      filter.projectId = query.projectId;
    }

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.title) {
      filter.title = { $regex: query.title, $options: 'i' };
    }

    return this.model.find(filter);
  }

  async findOne(id: number): Promise<IssueDocument> {
    const issue = await this.model.findOne({ id });

    if (!issue) {
      throw new NotFoundException(`No issue found with id ${id}.`);
    }

    return issue;
  }

  async create(
    dto: CreateIssueDto,
    reporterId: number,
  ): Promise<IssueDocument> {
    const project = await this.projectsService.findOne(dto.projectId);
    await this.requireWorkspaceMember(project.workspaceId, reporterId);

    if (dto.assigneeId != null) {
      await this.requireWorkspaceMember(project.workspaceId, dto.assigneeId);
    }

    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last?.id ?? 0) + 1;

    const issue = await this.model.insertOne({
      id,
      projectId: dto.projectId,
      reporterId,
      assigneeId: dto.assigneeId ?? null,
      title: dto.title,
      description: dto.description || '',
      status: 'todo',
    });

    this.logger.log(`Created issue ${issue.id} ("${issue.title}")`);

    return issue;
  }

  async update(
    id: number,
    dto: UpdateIssueDto,
    requesterId: number,
  ): Promise<IssueDocument> {
    const issue = await this.findOne(id);
    const project = await this.projectsService.findOne(issue.projectId);
    await this.assertCanMutateIssue(issue, project.workspaceId, requesterId);

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.requireWorkspaceMember(project.workspaceId, dto.assigneeId);
    }

    if (dto?.title !== undefined) {
      issue.title = dto.title;
    }

    if (dto?.description !== undefined) {
      issue.description = dto.description;
    }

    if (dto?.status !== undefined) {
      issue.status = dto.status;
    }

    if (dto.assigneeId !== undefined) {
      issue.assigneeId = dto.assigneeId;
    }

    const saved = await issue.save({ validateModifiedOnly: true });

    this.logger.log(`Updated issue ${saved.id} ("${saved.title}")`);

    return saved;
  }

  async remove(id: number, requesterId: number): Promise<IssueDocument> {
    const issue = await this.findOne(id);
    const project = await this.projectsService.findOne(issue.projectId);
    await this.assertCanMutateIssue(issue, project.workspaceId, requesterId);

    await issue.deleteOne();

    this.logger.log(`Deleted issue ${id} ("${issue.title}")`);

    return issue;
  }

  private async requireWorkspaceMember(
    workspaceId: number,
    userId: number,
  ): Promise<void> {
    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        userId,
      );

    if (!membership) {
      throw new ForbiddenException(
        `User ${userId} must be a member of workspace ${workspaceId}.`,
      );
    }
  }

  /*
   * Challenge answers:
   * 1. Yes. A guard could load the Issue, resolve its Project and membership,
   *    then check its assigneeId, reporterId, and membership role.
   * 2. This service already loads the Issue to mutate it, so authorization here
   *    keeps the decision beside the mutation and avoids a separate guard load.
   * 3. A guard and service could each query the same Issue, doubling database
   *    work and creating two reads of mutable resource state.
   * 4. Route metadata fits role policies that depend on route shape and shared
   *    values such as workspace roles and parameter sources.
   * 5. Service authorization fits rules based on this Issue's own assignee and
   *    reporter fields, alongside the service's existing load and mutation.
   * 6. A larger application could pass a loaded resource through request state
   *    or use a shared request-scoped loader so the guard and service reuse it.
   * 7. JWT claims are snapshots; current database state reflects changed roles,
   *    removed memberships, and updated assignment.
   */
  private async assertCanMutateIssue(
    issue: IssueDocument,
    workspaceId: number,
    requesterId: number,
  ): Promise<void> {
    if (issue.assigneeId === requesterId || issue.reporterId === requesterId) {
      return;
    }

    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        requesterId,
      );

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new ForbiddenException(
        'Only this issue’s reporter or assignee, or a workspace Owner or Admin, may change it.',
      );
    }
  }
}
