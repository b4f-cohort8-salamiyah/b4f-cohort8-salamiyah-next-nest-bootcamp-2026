import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import type { Issue, Project, Sprint } from "@/lib/types";
import { Board } from "@/components/board/Board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;
  const token = await requireSessionToken();

  const projectRes = await apiFetch(`/projects/${projectId}`);
  if (!projectRes.ok) {
    notFound();
  }
  const project: Project = await projectRes.json();

  const issuesRes = await apiFetch(`/issues?projectId=${project.id}`);
  const issues: Issue[] = await issuesRes.json();
  const sprintsRes = await apiFetch(`/projects/${project.id}/sprints`, { token });
  const sprints: Sprint[] = await sprintsRes.json();
  const activeSprint = sprints.find((sprint) => sprint.status === "active");
  const boardIssues = activeSprint
    ? issues.filter((issue) => issue.sprintId === activeSprint.id)
    : [];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${id}/projects/${project.id}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to project
      </Link>
      <h1 className="text-xl font-semibold">
        {project.key} -- Board
      </h1>
      {activeSprint ? (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active sprint: {activeSprint.name}
          </p>
          <Board issues={boardIssues} basePath={`/workspaces/${id}/projects/${project.id}`} />
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No active sprint. Move backlog issues into a sprint, then start it.
        </p>
      )}
    </main>
  );
}
