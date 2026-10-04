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
  { id: 1, name: 'Web App', key: 'WEB', description: 'Websites with React.' },
  { id: 2, name: 'Backend Api', key: 'API', description: 'Core services.' },
  { id: 3, name: 'Mobile App', key: 'MOB', description: 'IOS and Android.' },
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
      throw new BadRequestException('name must not be empty');
    }
    if (body?.key !== undefined) {
      const taken = this.projects.some(
        (candidate) => candidate.id !== id && candidate.key === body.key,
      );

      if (taken) {
        throw new ConflictException('key is already in use');
      }
    }

    if (body.name !== undefined) {
      project.name = body.name;
    }

    if (body.key !== undefined) {
      project.key = body.key;
    }

    return project;
  }
}
