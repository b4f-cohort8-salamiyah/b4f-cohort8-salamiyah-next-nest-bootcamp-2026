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
