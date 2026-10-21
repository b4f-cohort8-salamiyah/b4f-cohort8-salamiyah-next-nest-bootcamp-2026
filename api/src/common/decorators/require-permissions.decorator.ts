import { SetMetadata } from '@nestjs/common';

export type WorkspaceIdSource = 'body' | 'param' | 'projectParam';

export interface WorkspaceRoleMetadata {
  roles: string[];
  source: WorkspaceIdSource;
}

export const WORKSPACE_ROLE_KEY = 'workspace_role_key';

export const RequireWorkspaceRole = (
  roles: string[],
  source: WorkspaceIdSource,
) =>
  SetMetadata(WORKSPACE_ROLE_KEY, { roles, source } as WorkspaceRoleMetadata);
