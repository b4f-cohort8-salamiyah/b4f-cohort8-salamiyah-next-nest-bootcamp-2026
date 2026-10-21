import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ProjectsService } from '../projects.service';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectsService: ProjectsService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication is required.');
    }

    const projectId = Number(request.params.id);
    let workspaceId: number;

    if (request.params.id !== undefined) {
      if (!Number.isInteger(projectId)) {
        throw new BadRequestException('A valid project id is required.');
      }

      const project = await this.projectsService.findOne(projectId);
      workspaceId = project.workspaceId;
    } else {
      workspaceId = Number(
        (request.body as { workspaceId?: number } | undefined)?.workspaceId,
      );

      if (!Number.isInteger(workspaceId)) {
        throw new BadRequestException('A valid workspace id is required.');
      }
    }

    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        user.sub,
      );

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        `Only a ${requiredRoles.join(' or ')} may access this project.`,
      );
    }

    return true;
  }
}
