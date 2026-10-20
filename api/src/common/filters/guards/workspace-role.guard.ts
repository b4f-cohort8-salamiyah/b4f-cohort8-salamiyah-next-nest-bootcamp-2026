import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { WorkspaceMembersService } from '../../../workspace-members/workspace-members.service';
import { ProjectsService } from '../../../projects/projects.service';
import { JwtPayload } from '../../../auth/jwt-payload.interface';
import {
  REQUIRE_WORKSPACE_ROLE_KEY,
  RequireWorkspaceRoleMeta,
  WorkspaceIdSource,
} from '../../decorators/require-workspace-role.decorator';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceMembersService: WorkspaceMembersService,
    private readonly projectsService: ProjectsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<RequireWorkspaceRoleMeta>(
      REQUIRE_WORKSPACE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!meta) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    const workspaceId = await this.resolveWorkspaceId(request, meta.from);

    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        user.sub,
      );

    if (!membership || !meta.roles.includes(membership.role)) {
      throw new ForbiddenException(
        `Requires workspace role: ${meta.roles.join(' or ')}.`,
      );
    }

    return true;
  }

  private async resolveWorkspaceId(
    request: Request,
    from: WorkspaceIdSource,
  ): Promise<number> {
    if (from === 'workspaceParam') {
      return Number(request.params.id);
    }

    if (from === 'project') {
      const project = await this.projectsService.findOne(
        Number(request.params.id),
      );
      return project.workspaceId;
    }

    return Number((request.body as { workspaceId?: number })?.workspaceId);
  }
}
