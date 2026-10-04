import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

export interface Project {
  id: number;
  name: string;
  key: string;
  description: string;
}

const seedProjects: Project[] = [
  { id: 1, name: 'Web App', key: 'WEB', description: 'Customer UI' },
  { id: 2, name: 'Backend API', key: 'API', description: 'Core services' },
  { id: 3, name: 'Mobile App', key: 'MOB', description: 'iOS and Android' },
];

@Injectable()
export class ProjectsService {
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

  update(id: number, body: { name?: string; key?: string }): Project {
    const project = this.findOne(id);

    if (body?.name !== undefined && body.name.trim().length === 0) {
      throw new BadRequestException('name must not be empty.');
    }

    if (body?.key !== undefined) {
      const taken = this.projects.some(
        (candidate) => candidate.id !== id && candidate.key === body.key,
      );

      if (taken) {
        throw new ConflictException(
          `key "${body.key}" is already used by another project.`,
        );
      }
    }

    if (body?.name !== undefined) {
      project.name = body.name;
    }

    if (body?.key !== undefined) {
      project.key = body.key;
    }

    return project;
  }
  findByKey(key: string) {
    const project = this.projects.find((p) => p.key === key);
    if (!project) {
      throw new NotFoundException(`Project with key '${key}' not found`);
    }
    return project;
  }
  getStatus() {
    return this.projects.length;
  }
}
