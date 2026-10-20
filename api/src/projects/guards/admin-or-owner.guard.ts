import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkspaceMembersService } from 'src/workspace-members/workspace-members.service';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

@Injectable()
export class AdminOrOwnerGuard implements CanActivate {
  constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    const workspaceId = Number(
      (request.body as { workspaceId?: number })?.workspaceId,
    );

    const membership =
      await this.workspaceMembersService.findByWorkspaceAndUser(
        workspaceId,
        user.sub,
      );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace.');
    }

    if (!['admin', 'owner'].includes(membership.role)) {
      throw new ForbiddenException(
        'Only an Owner or Admin may create a project in this workspace.',
      );
    }

    return true;
  }
}
