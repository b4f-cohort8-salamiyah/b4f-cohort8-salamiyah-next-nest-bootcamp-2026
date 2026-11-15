import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue, Project } from "@/lib/types";
import Link from "next/link";
import { StatusFilter } from "@/components/issues/StatusFilter";
import { TitleSearch } from "@/components/issues/TitleSearch";
import { SortableIssueList } from "@/components/issues/SortableIssueList";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; projectId: string }>;
  searchParams: Promise<{ status?: string; title?: string }>;
}) {
  const { id, projectId } = await params;
  const { status, title } = await searchParams;

  const projectRes = await apiFetch(`/projects/${projectId}`);

  if (!projectRes.ok) {
    notFound();
  }

  const project: Project = await projectRes.json();

  // The real backend's own `status`/`title` query params -- sent directly, never filtered
  // client-side when the backend already supports them. Sorting is genuinely different: the
  // real backend has no sort parameter at all, so it is applied as client-derived state instead,
  // over whatever the backend already filtered (see SortableIssueList).
  const statusQuery = status ? `&status=${status}` : "";
  const titleQuery = title ? `&title=${title}` : "";
  const issuesRes = await apiFetch(`/issues?projectId=${project.id}${statusQuery}${titleQuery}`);
  const issues: Issue[] = await issuesRes.json();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${id}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to workspace
      </Link>
      <div>
        <h1 className="text-xl font-semibold">
          {project.key} -- {project.name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {project.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Link
          href={`/workspaces/${id}/projects/${project.id}/board`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Board
        </Link>
        <Link
          href={`/workspaces/${id}/projects/${project.id}/sprints`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Sprints
        </Link>
        <Link
          href={`/workspaces/${id}/projects/${project.id}/backlog`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Backlog
        </Link>
        <Link
          href={`/workspaces/${id}/projects/${project.id}/issues/new`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          + New issue
        </Link>
      </div>

      <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
        Issues
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <StatusFilter />
        <TitleSearch />
      </div>
      <SortableIssueList issues={issues} basePath={`/workspaces/${id}/projects/${project.id}`} />
    </main>
  );
}
