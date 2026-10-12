import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Workspace } from './schemas/workspace.schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { FindWorkspacesQueryDto } from './dto/find-workspaces-query.dto';

@Injectable()
export class WorkspacesService implements OnModuleInit {
  constructor(@InjectModel(Workspace.name) private model: Model<Workspace>) {}

  async onModuleInit() {
    const count = await this.model.countDocuments();
    if (count === 0) {
      await this.model.insertMany([
        {
          id: 1,
          name: 'Nova Engineering',
          slug: 'nova-eng',
          description: 'Engineering team',
        },
        {
          id: 2,
          name: 'Acme Robotics',
          slug: 'acme-robotics',
          description: 'Robotics lab',
        },
      ]);
    }
  }

  async findAll(query: FindWorkspacesQueryDto): Promise<Workspace[]> {
    return this.model.find(query);
  }

  async findOne(id: number): Promise<Workspace> {
    const workspace = await this.model.findOne({ id });
    if (!workspace) {
      throw new NotFoundException(`Workspace with id ${id} not found`);
    }
    return workspace;
  }

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const taken = await this.model.findOne({ slug: dto.slug });
    if (taken) {
      throw new ConflictException(`slug "${dto.slug}" is already used.`);
    }

    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last?.id || 0) + 1;

    const workspace = await this.model.create({
      id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
    });

    return workspace;
  }
  async remove(id: number): Promise<Workspace> {
    const deletedWorkspace = await this.model.findOneAndDelete({ id });

    if (!deletedWorkspace) {
      throw new NotFoundException(`Workspace with id ${id} not found`);
    }

    return deletedWorkspace;
  }

  async update(id: number, dto: UpdateWorkspaceDto): Promise<Workspace> {
    const workspace = await this.findOne(id); // للتحقق من وجوده

    if (dto.slug && dto.slug !== workspace.slug) {
      const taken = await this.model.findOne({ slug: dto.slug });
      if (taken) {
        throw new ConflictException(`slug "${dto.slug}" is already used.`);
      }
    }

    const updated = await this.model.findOneAndUpdate(
      { id },
      { $set: dto },
      { new: true },
    );

    return updated;
  }
}
