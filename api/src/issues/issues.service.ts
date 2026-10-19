import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Issue, IssueDocument } from './schemas/issue.schema';
import { FindIssuesQueryDto } from './dto/find-issues-query.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

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
export class IssuesService implements OnModuleInit {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    @InjectModel(Issue.name)
    private readonly model: Model<IssueDocument>,
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

    return this.model.find(filter);
  }

  async findOne(id: number): Promise<IssueDocument> {
    const issue = await this.model.findOne({ id });

    if (!issue) {
      throw new NotFoundException(`No issue found with id ${id}.`);
    }

    return issue;
  }

  async create(dto: CreateIssueDto): Promise<IssueDocument> {
    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last?.id ?? 0) + 1;

    const issue = await this.model.insertOne({
      id,
      projectId: dto.projectId,
      title: dto.title,
      description: dto.description || '',
      status: 'todo',
    });

    this.logger.log(`Created issue ${issue.id} ("${issue.title}")`);

    return issue;
  }

  async update(id: number, dto: UpdateIssueDto): Promise<IssueDocument> {
    const issue = await this.findOne(id);

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

    this.logger.log(`Updated issue ${saved.id} ("${saved.title}")`);

    return saved;
  }

  async remove(id: number): Promise<IssueDocument> {
    const deleted = await this.model.findOneAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException(`No issue found with id ${id}.`);
    }

    this.logger.log(`Deleted issue ${id} ("${deleted.title}")`);

    return deleted;
  }
}
