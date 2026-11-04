import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  findAll(query: FindProjectsQueryDto) {
    return this.prisma.project.findMany({
      where: {
        ...(query.name
          ? { name: { contains: query.name, mode: 'insensitive' as const } }
          : {}),
        ...(query.key ? { key: query.key } : {}),
      },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`No project found with id ${id}.`);
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    const taken = await this.prisma.project.findUnique({
      where: { key: dto.key },
    });

    if (taken) {
      throw new ConflictException(
        `key "${dto.key}" is already used by another project.`,
      );
    }

    const project = await this.prisma.project.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        key: dto.key,
        description: dto.description || '',
      },
    });

    this.logger.log(`Created project ${project.id} ("${project.name}")`);

    return project;
  }

  async update(id: number, dto: UpdateProjectDto) {
    await this.findOne(id);

    if (dto?.key !== undefined) {
      const taken = await this.prisma.project.findUnique({
        where: { key: dto.key },
      });
      if (taken && taken.id !== id) {
        throw new ConflictException(
          `key "${dto.key}" is already used by another project.`,
        );
      }
    }

    const saved = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto?.name !== undefined ? { name: dto.name } : {}),
        ...(dto?.key !== undefined ? { key: dto.key } : {}),
        ...(dto?.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });

    this.logger.log(`Updated project ${saved.id} ("${saved.name}")`);

    return saved;
  }

  async findByKey(key: string) {
    const project = await this.prisma.project.findUnique({ where: { key } });

    if (!project) {
      throw new NotFoundException(`No project found with key "${key}".`);
    }

    return project;
  }

  async stats(): Promise<{ total: number }> {
    const total = await this.prisma.project.count();
    this.logger.log(`Internal tool read project stats (total: ${total})`);
    return { total };
  }

  async remove(id: number) {
    await this.findOne(id);

    const deleted = await this.prisma.project.delete({ where: { id } });

    this.logger.log(`Deleted project ${id} ("${deleted.name}")`);

    return deleted;
  }
}
