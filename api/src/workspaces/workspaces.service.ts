import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { Model } from 'mongoose';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';

const seedWorkspaces = [
  {
    id: 1,
    name: 'Engineering',
    slug: 'engineering',
    description: 'Product engineering workspace',
  },
  {
    id: 2,
    name: 'Design',
    slug: 'design',
    description: 'Product design workspace',
  },
  {
    id: 3,
    name: 'Operations',
    slug: 'operations',
    description: 'Business operations workspace',
  },
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
<<<<<<< HEAD
      const taken = this.model.findOne({ slug: dto.slug, id: { $ne: id } });
=======
      const taken = this.workspaces.some(
        (candidate) => candidate.id !== id && candidate.slug === dto.slug,
      );

>>>>>>> 91be62fcf80969fab353b7583a0dcda3d7136449
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

<<<<<<< HEAD
  async remove(id: number): Promise<WorkspaceDocument> {
    const deleted = await this.model.findOneAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    this.logger.log(`Deleted workspace ${id} ("${deleted.name}")`);

    return deleted;
=======
  findBySlug(slug:string):Workspace{
    if (slug !== undefined) {
      const workSpace = this.workspaces.find(
        (candidate) => candidate.slug === slug
      );
      if (!workSpace) {
        throw new NotFoundException(
          `there is no workspace with the slug :  "${slug}".`,
        );
      }
      return workSpace;
    }
>>>>>>> 91be62fcf80969fab353b7583a0dcda3d7136449
  }
}

