import {
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
    const taken = this.workspaces.some(
      (candidate) => candidate.slug === dto.slug,
    );

    if (taken) {
      throw new ConflictException(
        `slug "${dto.slug}" is already used by another workspace.`,
      );
    }

    const workspace: Workspace = {
      id: this.nextId++,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
    };
    this.workspaces.push(workspace);
    return workspace;
  }

  update(id: number, dto: UpdateWorkspaceDto): Workspace {
    const workspace = this.findOne(id);

    if (dto?.slug !== undefined) {
      const taken = this.workspaces.some(
        (candidate) => candidate.id !== id && candidate.slug === dto.slug,
      );

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

    return workspace;
  }

  findBySlug(slug: string): Workspace {
    const workspace = this.workspaces.find(
      (candidate) => candidate.slug === slug,
    );

    if (!workspace) {
      throw new NotFoundException(`No workspace found with slug "${slug}".`);
    }

    return workspace;
  }

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
  }
}

