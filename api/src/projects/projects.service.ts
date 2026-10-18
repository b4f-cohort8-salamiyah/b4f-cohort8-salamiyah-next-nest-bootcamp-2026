import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { Model } from 'mongoose';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';

const seedProjects = [
  { id: 1, name: 'Web App', key: 'WEB', description: 'Customer UI' },
  { id: 2, name: 'Backend API', key: 'API', description: 'Core services' },
  { id: 3, name: 'Mobile App', key: 'MOB', description: 'iOS and Android' },
];

@Injectable()
export class ProjectsService implements OnModuleInit {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly model: Model<ProjectDocument>,
  ) {}

  async onModuleInit() {
    const existing = await this.model.countDocuments();

    if (existing === 0) {
      await this.model.insertMany(seedProjects);
    }
  }

  async findAll(query: FindProjectsQueryDto): Promise<ProjectDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.key) {
      filter.key = query.key;
    }

    return this.model.find(filter);
  }

  async findOne(id: number): Promise<ProjectDocument> {
    const project = await this.model.findOne({ id });

    if (!project) {
      throw new NotFoundException(`No project found with id ${id}.`);
    }

    return project;
  }

  async create(dto: CreateProjectDto): Promise<ProjectDocument> {
    const taken = await this.model.findOne({ key: dto.key });

    if (taken) {
      throw new ConflictException(
        `key "${dto.key}" is already used by another project.`,
      );
    }

    const last = await this.model.findOne().sort({ id: -1 });
    const id = (last.id || 0) + 1;

    const project = await this.model.insertOne({
      id,
      name: dto.name,
      key: dto.key,
      description: dto.description || '',
    });

    this.logger.log(`Created project ${project.id} ("${project.name}")`);

    return project;
  }

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.findOne(id);

    if (dto?.key !== undefined) {
      const taken = await this.model.findOne({ key: dto.key, id: { $ne: id } });

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

    const saved = await project.save();

    this.logger.log(`Updated project ${saved.id} ("${saved.name}")`);

    return saved;
  }

  async findByKey(key: string): Promise<ProjectDocument> {
    const project = await this.model.findOne({ key: key });

    if (!project) {
      throw new NotFoundException(`No project found with key "${key}".`);
    }

    return project;
  }

  async stats(): Promise<{ total: number }> {
    const total = await this.model.countDocuments();
    this.logger.log(`Internal tool read project stats (total: ${total})`);
    return { total };
  }

  async remove(id: number): Promise<ProjectDocument> {
    const deleted = await this.model.findOneAndDelete({ id });

    if (!deleted) {
      throw new NotFoundException(`No project found with id ${id}.`);
    }

    this.logger.log(`Deleted project ${id} ("${deleted.name}")`);

    return deleted;
  }
}
