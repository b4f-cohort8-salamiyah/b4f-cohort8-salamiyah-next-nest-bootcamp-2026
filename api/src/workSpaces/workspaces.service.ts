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
  { id: 1, name: 'Web App', slug: 'WEB', description: 'Customer UI' },
  { id: 2, name: 'Backend API', slug: 'API', description: 'Core services' },
  { id: 3, name: 'Mobile App', slug: 'MOB', description: 'iOS and Android' },
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
          `key "${body.slug}" is already used by another project.`,
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
}
