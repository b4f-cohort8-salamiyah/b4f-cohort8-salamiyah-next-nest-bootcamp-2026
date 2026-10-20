import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue, IssueDocument } from './schemas/issue.schema';
import { FindIssuesQueryDto } from './dto/find-issues-query.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ProjectsService } from '../projects/projects.service';
import { WorkspaceMember } from '../workspace-members/schemas/workspace-member.schema';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];

function buildSeedIssues() {
  const issues: Array<{
    id: number;
    projectId: number;
    title: string;
    description: string;
    status: string;
    reporterId?: number;
    assigneeId?: number | null;
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
        reporterId: 1, 
        assigneeId: null,
      });
    }
  }

  return issues;
}

@Injectable()
export class IssuesService implements OnModuleInit {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @InjectModel(Issue.name)
    private readonly model: Model<IssueDocument>,
    @InjectModel(WorkspaceMember.name)
    private readonly workspaceMemberModel: Model<WorkspaceMember>,
    private readonly projectsService: ProjectsService,
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

 
  private async validateWorkspaceMembership(workspaceId: any, userId: any) {
    const membership = await this.workspaceMemberModel.findOne({
      workspaceId: workspaceId,
      userId: userId,
    });
    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace.');
    }
    return membership;
  }

  async create(dto: CreateIssueDto & { assigneeId?: number }, userId: number): Promise<IssueDocument> {
   
    const project = await this.projectsService.findOne(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Project with id ${dto.projectId} not found.`);
    }

    
    await this.validateWorkspaceMembership(project.workspaceId, userId);

    
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.validateWorkspaceMembership(project.workspaceId, dto.assigneeId);
    }

    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last?.id ?? 0) + 1;

    const issue = await this.model.create({
      id,
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description || '',
      status: 'todo',
      reporterId: userId, 
      assigneeId: dto.assigneeId ?? null,
    });

    this.logger.log(`Created issue ${issue.id} ("${issue.title}") by reporter ${userId}`);

    return issue;
  }


  async update(id: number, dto: UpdateIssueDto & { assigneeId?: number }, userId: number): Promise<IssueDocument> {
    const issue = await this.findOne(id);

    
    const project = await this.projectsService.findOne(issue.projectId);
    const membership = await this.workspaceMemberModel.findOne({
      workspaceId: project.workspaceId,
      userId: userId,
    });

    const isAdminOrOwner = membership && ['admin', 'owner'].includes(membership.role);
    const isReporter = issue.reporterId === userId;
    const isAssignee = issue.assigneeId === userId;

    if (!isReporter && !isAssignee && !isAdminOrOwner) {
      throw new ForbiddenException('You are not authorized to update this issue.');
    }

   
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.validateWorkspaceMembership(project.workspaceId, dto.assigneeId);
      issue.assigneeId = dto.assigneeId;
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

    const saved = await issue.save();

    this.logger.log(`Updated issue ${saved.id} ("${saved.title}") by user ${userId}`);

    return saved;
  }

  async remove(id: number, userId: number): Promise<IssueDocument> {
    const issue = await this.findOne(id);

   
    const project = await this.projectsService.findOne(issue.projectId);
    const membership = await this.workspaceMemberModel.findOne({
      workspaceId: project.workspaceId,
      userId: userId,
    });

    const isAdminOrOwner = membership && ['admin', 'owner'].includes(membership.role);
    const isReporter = issue.reporterId === userId;
    const isAssignee = issue.assigneeId === userId;

    if (!isReporter && !isAssignee && !isAdminOrOwner) {
      throw new ForbiddenException('You are not authorized to delete this issue.');
    }

    const deleted = await this.model.findOneAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException(`No issue found with id ${id}.`);
    }

    this.logger.log(`Deleted issue ${id} ("${deleted.title}") by user ${userId}`);

    return deleted;
  }
}