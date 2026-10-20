import { SetMetadata } from '@nestjs/common';

export type WorkspaceIdSource = 'body' | 'workspaceParam' | 'project';

export interface RequireWorkspaceRoleMeta {
  roles: string[];
  from: WorkspaceIdSource;
}

export const REQUIRE_WORKSPACE_ROLE_KEY = 'requireWorkspaceRole';

export const RequireWorkspaceRole = (
  roles: string[],
  from: WorkspaceIdSource = 'body',
) => SetMetadata(REQUIRE_WORKSPACE_ROLE_KEY, { roles, from });
