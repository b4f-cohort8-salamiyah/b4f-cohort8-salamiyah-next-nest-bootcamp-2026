import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';

const seedWorkspaces = [
  {
    id: 1,
    name: 'Acme Robotics',
    slug: 'acme-robotics',
    description: 'Internal tools',
  },
  { id: 2, name: 'Nova Labs', slug: 'nova-labs', description: 'Prototypes' },
];

@Injectable()
export class WorkspacesService implements OnModuleInit {
  private readonly logger = new Logger(WorkspacesService.name);
  constructor(
    @InjectModel(Workspace.name)
    private readonly model: Model<WorkspaceDocument>,
  ) {}

  async onModuleInit() {
    const existing = await this.model.countDocuments();

    if (existing === 0) {
      await this.model.insertMany(seedWorkspaces);
    }
  }

  async findAll(query: FindWorkspacesQueryDto): Promise<WorkspaceDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.slug) {
      filter.slug = query.slug;
    }

    return this.model.find(filter);
  }

  async findOne(id: number): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ id });

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    return workspace;
  }

  async create(dto: CreateWorkspaceDto): Promise<WorkspaceDocument> {
    const taken = await this.model.findOne({ slug: dto.slug });

    if (taken) {
      throw new ConflictException(
        `slug "${dto.slug}" is already used by another workspace.`,
      );
    }

    const last = await this.model.findOne().sort({ id: -1 }).exec();
    const id = (last?.id ?? 0) + 1;

    const workspace = new this.model({
      id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
    });

    const saved = await workspace.save();
    this.logger.log(`Created workspace ${saved.id} ("${saved.name}")`);

    return saved;
  }

  async update(
    id: number,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    const workspace = await this.findOne(id);

    if (dto?.slug !== undefined) {
      const taken = await this.model.findOne({
        slug: dto.slug,
        id: { $ne: id },
      });
      if (taken) {
        throw new ConflictException(
          `slug "${dto.slug}" is already used by another workspace.`,
        );
      }
    }

    if (dto?.name !== undefined) workspace.name = dto.name;
    if (dto?.slug !== undefined) workspace.slug = dto.slug;
    if (dto?.description !== undefined) workspace.description = dto.description;

    if (dto?.slug !== undefined) {
      workspace.slug = dto.slug;
    }

    if (dto?.description !== undefined) {
      workspace.description = dto.description;
    }

    const saved = await workspace.save();

    this.logger.log(`Updated workspace ${saved.id} ("${saved.name}")`);

    return saved;
  }

  async findBySlug(slug: string): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ slug });

    if (!workspace) {
      throw new NotFoundException(`No workspace found with slug "${slug}".`);
    }

    return workspace;
  }

  async remove(id: number): Promise<WorkspaceDocument> {
    const deleted = await this.model.findOneAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    this.logger.log(`Deleted workspace ${id} ("${deleted.name}")`);

    return deleted;
  }
}
