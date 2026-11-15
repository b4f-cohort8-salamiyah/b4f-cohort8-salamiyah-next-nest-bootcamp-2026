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
  priority: string;
  storyPoints: number | null;
  sprintId: number | null;
  assigneeId: number | null;
  reporterId: number;
  createdAt: string;
};

export type Sprint = {
  id: number;
  projectId: number;
  name: string;
  goal: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  points: {
    issueCount: number;
    totalPoints: number;
    completedPoints: number;
    completionPercent: number;
  };
};

export type Comment = {
  id: number;
  issueId: number;
  authorId: number | null;
  body: string;
  createdAt: string;
  author: { id: number; name: string } | null;
};
