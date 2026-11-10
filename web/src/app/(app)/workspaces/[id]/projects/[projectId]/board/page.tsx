import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue, Project } from "@/lib/types";
import Link from "next/link";
import { Board } from "@/components/board/Board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;

  const projectRes = await apiFetch(`/projects/${projectId}`);
  if (!projectRes.ok) {
    notFound();
  }
  const project: Project = await projectRes.json();

  const issuesRes = await apiFetch(`/issues?projectId=${project.id}`);
  const issues: Issue[] = await issuesRes.json();

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
      <Board issues={issues} basePath={`/workspaces/${id}/projects/${project.id}`} />
    </main>
  );
}