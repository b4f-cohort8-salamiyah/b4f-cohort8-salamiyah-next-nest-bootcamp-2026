export type Workspace = {
  id: number;
  name: string;
  slug: string;
  description: string;
  ownerId: number;
  createdAt: string;
};

export type Project = {
  id: number;
  workspaceId: number;
  key: string;
  name: string;
  description: string;
  issueSeq: number;
  createdAt: string;
};

export type Issue = {
  id: number;
  projectId: number;
  key: string;
  title: string;
  description: string;
  status: string;
  assigneeId: number | null;
  reporterId: number;
  createdAt: string;
};
