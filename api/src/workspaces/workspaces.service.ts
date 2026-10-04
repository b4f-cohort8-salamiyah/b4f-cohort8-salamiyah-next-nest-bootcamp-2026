import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

  update(id: number, body: { name?: string; slug?: string }): Workspace {
    const workspace = this.findOne(id);

    if (body?.name !== undefined && body.name.trim().length === 0) {
      throw new BadRequestException('name must not be empty.');
    }

    if (body?.slug !== undefined) {
      const taken = this.workspaces.some(
        (candidate) => candidate.id !== id && candidate.slug === body.slug,
      );

      if (taken) {
        throw new ConflictException(
          `slug "${body.slug}" is already used by another workspace.`,
        );
      }
    }

    if (body?.name !== undefined) {
      workspace.name = body.name;
    }

    if (body?.slug !== undefined) {
      workspace.slug = body.slug;
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

