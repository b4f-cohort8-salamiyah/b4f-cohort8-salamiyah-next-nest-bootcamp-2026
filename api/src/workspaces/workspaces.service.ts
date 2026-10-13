import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
<<<<<<< HEAD
import { InjectModel } from '@nestjs/mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { Model } from 'mongoose';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';

const seedWorkspaces = [
=======
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';

const seedWorkspaces: Workspace[] = [
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e
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

<<<<<<< HEAD
  async onModuleInit() {
=======
  async onModuleInit(): Promise<void> {
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e
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

<<<<<<< HEAD
    return this.model.find(filter);
  }

  async findOne(id: number): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ id });
=======
    return this.model.find(filter).exec();
  }

  async findOne(id: number): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ id }).exec();
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    return workspace;
  }

  async create(dto: CreateWorkspaceDto): Promise<WorkspaceDocument> {
<<<<<<< HEAD
    const taken = await this.model.findOne({ slug: dto.slug });
=======
    const taken = await this.model.findOne({ slug: dto.slug }).exec();
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e

    if (taken) {
      throw new ConflictException(
        `slug "${dto.slug}" is already used by another workspace.`,
      );
    }

    const last = await this.model.findOne().sort({ id: -1 }).exec();
<<<<<<< HEAD
    const id = (last?.id ?? 0) + 1;

    const workspace = new this.model({
      id,
=======
    const workspace = await this.model.create({
      id: (last?.id ?? 0) + 1,
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
    });

<<<<<<< HEAD
    return workspace.save();
=======
    return workspace;
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e
  }

  async update(
    id: number,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    const workspace = await this.findOne(id);

    if (dto?.slug !== undefined) {
<<<<<<< HEAD
      const taken = this.model.findOne({ slug: dto.slug, id: { $ne: id } });
=======
      const taken = await this.model
        .findOne({ slug: dto.slug, id: { $ne: id } })
        .exec();

>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e
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
<<<<<<< HEAD
  }

  async findBySlug(slug: string): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ slug });
=======
  }

  async remove(id: number): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOneAndDelete({ id }).exec();

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    return workspace;
  }

  async findBySlug(slug: string): Promise<WorkspaceDocument> {
    const workspace = await this.model.findOne({ slug }).exec();
>>>>>>> c20caf700f10ce2d95db03f86ed7f1ecd3ab1c7e

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

    return deleted;
  }
}
