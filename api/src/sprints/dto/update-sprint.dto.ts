import { PartialType } from '@nestjs/swagger';
import { CreateSprintDto } from './create-sprint.dto';

// Only name/goal -- status transitions are their own real, dedicated routes
// (POST /sprints/:id/start, POST /sprints/:id/complete), never a plain field a client could set
// to anything (e.g. skipping straight to "completed"), per Sprint's own forward-only lifecycle.
export class UpdateSprintDto extends PartialType(CreateSprintDto) {}
