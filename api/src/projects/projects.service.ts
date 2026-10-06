import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';

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
  private nextId = seedProjects.length + 1;

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

  create(dto: CreateProjectDto): Project {
    const taken = this.projects.some((candidate) => candidate.key === dto.key);

    if (taken) {
      throw new ConflictException(
        `key "${dto.key}" is already used by another project.`,
      );
    }

    const project: Project = {
      id: this.nextId++,
      name: dto.name,
      key: dto.key,
      description: dto.description || '',
    };

    this.projects.push(project);
    return project;
  }

  update(id: number, dto: UpdateProjectDto): Project {
    const project = this.findOne(id);

    if (dto?.key !== undefined) {
      const taken = this.projects.some(
        (candidate) => candidate.id !== id && candidate.key === dto.key,
      );

      if (taken) {
        throw new ConflictException(
          `key "${dto.key}" is already used by another project.`,
        );
      }
    }

    if (dto?.name !== undefined) {
      project.name = dto.name;
    }

    if (dto?.key !== undefined) {
      project.key = dto.key;
    }

    if (dto?.description !== undefined) {
      project.description = dto.description;
    }

    return project;
  }

  findByKey(key: string): Project {
    const project = this.projects.find((candidate) => candidate.key === key);

    if (!project) {
      throw new NotFoundException(`No project found with key "${key}".`);
    }

    return project;
  }

  stats(): { total: number } {
    return { total: this.projects.length };
  }
}
