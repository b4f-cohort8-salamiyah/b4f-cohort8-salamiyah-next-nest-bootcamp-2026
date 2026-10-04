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
    name: 'Acme Robotics',
    slug: 'acme-robotics',
    description: 'Internal tools',
  },
  { id: 2, name: 'Nova Labs', slug: 'nova-labs', description: 'Prototypes' },
];

@Injectable()
export class WorkspacesService {
  private readonly workspaces: Workspace[] = seedWorkspaces;

  findBySlug(slug: string): Workspace {
    const workspace = this.workspaces.find(
      (candidate) => candidate.slug === slug,
    );

    if (!workspace) {
      throw new NotFoundException(`No workspace found with slug ${slug}.`);
    }

    return workspace;
  }

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
}
