import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const seedWorkspaces: Workspace[] = [
  { id: 1, name: 'Web App', slug: 'WEB', description: 'Customer UI' },
  { id: 2, name: 'Backend API', slug: 'API', description: 'Core services' },
  { id: 3, name: 'Mobile App', slug: 'MOB', description: 'iOS and Android' },
];

@Injectable()
export class WorkspacesService {
  private readonly workspaces: Workspace[] = seedWorkspaces;
  private nextId = seedWorkspaces.length + 1;

  findAll(): Workspace[] {
    return this.workspaces;
  }

  findOne(id: number): Workspace {
    const workspace = this.workspaces.find((candidate) => candidate.id === id);

    if (!workspace) {
      throw new NotFoundException(`No workspace found with id ${id}.`);
    }

    return workspace;
  }

    create(dto: CreateWorkspaceDto): Workspace {
    const taken = this.workspaces.some((candidate) => candidate.slug === dto.slug);

    if (taken) {
      throw new ConflictException(
        `key "${dto.slug}" is already used by another project.`,
      );
    }

    const workspace: Workspace = {
      id: this.nextId++,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || '',
    };

    this.workspaces.push(workspace);
    return workspace;
  }

  update(id: number, dto: UpdateWorkspaceDto): Workspace {
    const workspace = this.findOne(id);

    if (dto?.name !== undefined && dto.name.trim().length === 0) {
      throw new BadRequestException('name must not be empty.');
    }

    if (dto?.slug !== undefined) {
      const taken = this.workspaces.some(
        (candidate) => candidate.id !== id && candidate.slug === dto.slug,
      );

      if (taken) {
        throw new ConflictException(
          `key "${dto.slug}" is already used by another project.`,
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

    return workspace;
  }

    findBySlug(slug: string): Workspace {
    const workspace = this.workspaces.find((candidate) => candidate.slug === slug);

    if (!workspace) {
      throw new NotFoundException(`No project found with key "${slug}".`);
    }

    return workspace;
  }

  stats(): { total: number } {
    return { total: this.workspaces.length };
  }
}
