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
import { WorkspaceMemberDocument } from 'src/workspace-members/schemas/workspace-member.schema';
import { ProjectsService } from 'src/projects/projects.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];

function buildSeedIssues() {
  const issues: Array<{
    id: number;
    projectId: number;
    title: string;
    description: string;
    status: string;
  }> = [];
  let id = 1;

  for (const projectId of [1, 2, 3]) {
    for (let i = 0; i < 60; i++) {
      issues.push({
        id: id++,
        projectId,
        title: `Issue ${id} for project ${projectId}`,
        description: '',
        status: STATUSES[i % STATUSES.length],
      });
    }
  }

  return issues;
}

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @InjectModel(Issue.name)
    private readonly model: Model<IssueDocument>,
    private readonly projectsService: ProjectsService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  async onModuleInit() {
    const existing = await this.model.countDocuments();

    if (existing === 0) {
      await this.model.insertMany(buildSeedIssues());
    }
  }

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
    await this.requireMembership(project.workspaceId, reporterId);

    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last?.id ?? 0) + 1;

    const issue = await this.model.insertOne({
      id,
      projectId: dto.projectId,
      reporterId,
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
    requestingUserId: number,
  ): Promise<IssueDocument> {
    const issue = await this.findOne(id);
    await this.requireOwnershipOrRole(issue, requestingUserId);

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

  async remove(id: number, requestingUserId: number): Promise<IssueDocument> {
    const issue = await this.model.findOne({ id });
    await this.requireOwnershipOrRole(issue, requestingUserId);

    const deleted = await this.model.findOneAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException(`No issue found with id ${id}.`);
    }

    this.logger.log(`Deleted issue ${id} ("${deleted.title}")`);

    return deleted;
  }

  private async requireOwnershipOrRole(
    issue: IssueDocument,
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

  private async requireMembership(
    workspaceId: number,
    userId: number,
  ): Promise<WorkspaceMemberDocument> {
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
