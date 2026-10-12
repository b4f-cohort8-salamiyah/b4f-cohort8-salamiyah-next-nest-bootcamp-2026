import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.workspaceModel.estimatedDocumentCount();
    if (count > 0) return;

    await this.workspaceModel.create([
      {
        id: 1,
        name: 'Acme Robotics',
        slug: 'acme-robotics',
        description: 'Internal tools',
      },
      {
        id: 2,
        name: 'Nova Labs',
        slug: 'nova-labs',
        description: 'Prototypes',
      },
    ]);
  }

  async findAll(query: FindWorkspacesQueryDto): Promise<WorkspaceDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.slug) {
      filter.slug = query.slug;
    }

    return this.workspaceModel.find(filter).exec();
  }

  async findOne(id: number): Promise<WorkspaceDocument> {
    const workspace = await this.workspaceModel.findOne({ id }).exec();

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    return workspace;
  }

  async create(dto: CreateWorkspaceDto): Promise<WorkspaceDocument> {
    const taken = await this.workspaceModel
      .findOne({ slug: dto.slug })
      .exec();

    if (taken) {
      throw new ConflictException(
        `slug "${dto.slug}" is already used by another workspace.`,
      );
    }

    const last = await this.workspaceModel
      .findOne()
      .sort({ id: -1 })
      .exec();
    const nextId = last ? last.id + 1 : 1;

    const created = new this.workspaceModel({
      id: nextId,
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? '',
    });

    return created.save();
  }

  async update(
    id: number,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    const workspace = await this.findOne(id);

    if (dto?.slug !== undefined) {
      const taken = await this.workspaceModel
        .findOne({ slug: dto.slug, id: { $ne: id } })
        .exec();

      if (taken) {
        throw new ConflictException(
          `slug "${dto.slug}" is already used by another workspace.`,
        );
      }
    }

    if (dto?.name !== undefined) workspace.name = dto.name;
    if (dto?.slug !== undefined) workspace.slug = dto.slug;
    if (dto?.description !== undefined) workspace.description = dto.description;

    return workspace.save();
  }

  

  async findBySlug(slug: string): Promise<WorkspaceDocument> {
    const workspace = await this.workspaceModel.findOne({ slug }).exec();

    if (!workspace) {
      throw new NotFoundException(`No workspace found with slug "${slug}".`);
    }

    return workspace;
  }
  async remove(id: number) {
  const deleted = await this.workspaceModel
    .findOneAndDelete({ id })
    .exec();

  if (!deleted) {
    throw new NotFoundException(`Workspace with id ${id} not found`);
  }

  return deleted;
}
}