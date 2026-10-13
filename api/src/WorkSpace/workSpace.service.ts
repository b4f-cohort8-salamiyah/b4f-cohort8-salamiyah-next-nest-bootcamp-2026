import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string;
}

const seedProjects: Project[] = [
  { id: 1, name: 'Web App', slug: 'web-app', description: 'Customer UI' },
  { id: 2, name: 'Backend API', slug: 'backend-api', description: 'Core services' },
  { id: 3, name: 'Mobile App', slug: 'mobile-app', description: 'iOS and Android' },
];

@Injectable()
export class WorkSpaceService {
  private readonly projects: Project[] = seedProjects;

  findAll(): Project[] {
    return this.projects;
  }

  findOne(id: number): Project {
    const project = this.projects.find((candidate) => candidate.id === id);

    if (!project) {
      throw new NotFoundException(`No project found with id ${id}.`);
    }

    return project;
  }

  update(id: number, body: { name?: string; slug?: string }): Project {
    const project = this.findOne(id);

    if (body?.name !== undefined && body.name.trim().length === 0) {
      throw new BadRequestException('name must not be empty.');
    }

    if (body?.slug !== undefined) {
      const taken = this.projects.some(
        (candidate) => candidate.id !== id && candidate.slug === body.slug,
      );

      if (taken) {
        throw new ConflictException(
          `slug "${body.slug}" is already used by another project.`,
        );
      }
    }

    if (body?.name !== undefined) {
      project.name = body.name;
    }

    if (body?.slug !== undefined) {
      project.slug = body.slug;
    }

    return project;
  }
}
