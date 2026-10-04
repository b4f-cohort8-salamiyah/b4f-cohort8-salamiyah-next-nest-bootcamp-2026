//Added: Store workspaces and handle lookup, validation, and updates in memory.
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

@Injectable()
export class WorkspacesService {
  private readonly workspaces: Workspace[] = [
    {
      id: 1,
      name: 'Bootcamp',
      slug: 'bootcamp',
      description: 'Learning tasks and team exercises',
    },
    {
      id: 2,
      name: 'Graduation Project',
      slug: 'graduation-project',
      description: 'Planning and building our final project',
    },
    {
      id: 3,
      name: 'Community',
      slug: 'community',
      description: 'Shared ideas and community activities',
    },
  ];

  //Added: Return all workspaces, or find one and return 404 if it is missing.
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

  update(
    id: number,
    body: { name?: string; slug?: string; description?: string },
  ): Workspace {
    //Added: Look up the workspace first so a missing resource always returns 404.
    const workspace = this.findOne(id);

    //Added: Validate every supplied field before changing stored data.
    if (
      body?.name !== undefined &&
      (typeof body.name !== 'string' || body.name.trim().length === 0)
    ) {
      throw new BadRequestException('name must be a non-empty string.');
    }

    if (body?.slug !== undefined) {
      if (typeof body.slug !== 'string') {
        throw new BadRequestException('slug must be a string.');
      }

      //Added: Keeping the current slug is allowed; another workspace cannot use it.
      const taken = this.workspaces.some(
        (candidate) => candidate.id !== id && candidate.slug === body.slug,
      );

      if (taken) {
        throw new ConflictException(
          `slug "${body.slug}" is already used by another workspace.`,
        );
      }
    }

    if (
      body?.description !== undefined &&
      typeof body.description !== 'string'
    ) {
      throw new BadRequestException('description must be a string.');
    }

    //Added: Apply only supplied fields after all checks pass; preserve the id.
    if (body?.name !== undefined) {
      workspace.name = body.name;
    }
    if (body?.slug !== undefined) {
      workspace.slug = body.slug;
    }
    if (body?.description !== undefined) {
      workspace.description = body.description;
    }

    return workspace;
  }
}
