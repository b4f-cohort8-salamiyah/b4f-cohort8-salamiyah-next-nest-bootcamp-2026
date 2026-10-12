import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FindWorkSpaceQueryDto } from './dto/find-workspaces-query.dto';

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

  async findAll(query: FindWorkSpaceQueryDto): Promise<WorkspaceDocument[]> {
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
    const taken = await this.model.findOne({ sulg: dto.slug });

    if (taken) {
      throw new ConflictException(
        `slug "${dto.slug}" is already used by another workspace.`,
      );
    }
    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last.id || 0) + 1;
    const workspace = await this.model.create({
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
      const taken = this.model.findOne({ slug: dto.slug, id: { $ne: id } });
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
    const workspace = await this.model.findOne({
      slug: slug,
    });

    if (!workspace) {
      throw new NotFoundException(`No workspace found with slug "${slug}".`);
    }

    return workspace;
  }
  async remove(id: number) {
    const workspace = await this.model.findOneAndDelete({ id });
    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }
    return workspace;
  }
}
