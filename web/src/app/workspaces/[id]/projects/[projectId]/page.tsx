import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue, Project } from "@/lib/types";
import Link from "next/link";
import { StatusFilter } from "@/components/issues/StatusFilter";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; projectId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id, projectId } = await params;
  const { status } = await searchParams;

  const projectRes = await apiFetch(`/projects/${projectId}`);

  if (!projectRes.ok) {
    notFound();
  }

  const project: Project = await projectRes.json();

  const issuesQuery = status ? `&status=${status}` : "";
  const issuesRes = await apiFetch(
    `/issues?projectId=${project.id}${issuesQuery}`,
  );
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

      <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
        Issues
      </h2>
      <StatusFilter />
      <div className="flex flex-col gap-3">
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={`/workspaces/${id}/projects/${project.id}/issues/${issue.id}`}
          >
            <Card>
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate font-medium">
                  {issue.key}: {issue.title}
                </p>
                <StatusBadge status={issue.status} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
