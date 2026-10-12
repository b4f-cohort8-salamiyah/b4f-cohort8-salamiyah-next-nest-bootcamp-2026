import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { Model } from 'mongoose';
import { FindWorkspaceQueryDto } from './dto/find-workspace-query.dto';

const seedWorkspaces = [
  { id: 1, name: 'Web App', slug: 'WEB', description: 'Customer UI' },
  { id: 2, name: 'Backend API', slug: 'API', description: 'Core services' },
  { id: 3, name: 'Mobile App', slug: 'MOB', description: 'iOS and Android' },
];

@Injectable()
export class WorkspacesService implements OnModuleInit {
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

  findAll(query: FindWorkspaceQueryDto): Promise<WorkspaceDocument[]> {
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
        `key "${dto.slug}" is already used by another project.`,
      );
    }

    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last.id || 0) + 1;

    const workspace = await this.model.insertOne({
      id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
    });

    return workspace;
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

    if (dto?.name !== undefined) {
      workspace.name = dto.name;
    }

    if (dto?.slug !== undefined) {
      workspace.slug = dto.slug;
    }

    if (dto?.description !== undefined) {
      workspace.description = dto.description;
    }

    return workspace.save();
  }

  async findBySlug(slug: string): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ slug: slug });

    if (!workspace) {
      throw new NotFoundException(`No project found with key "${slug}".`);
    }

    return workspace;
  }

  async stats(): Promise<{ total: number }> {
    return { total: await this.model.countDocuments() };
  }

  async findOneAndDelete(id: number): Promise<void> {
    const match = await this.model.findById(id);

    if (!match) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    this.model.deleteOne({ id: id });
  }
}
