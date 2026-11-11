import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import type { Issue, Project, Sprint } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { IssueEditPanel } from "@/components/issues/IssueEditPanel";

export default async function BacklogPage({
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

  // The real backend has no sprintId filter param at all -- the identical real situation
  // SortableIssueList (Session 24) already faced for sorting: filtered client-side, over data
  // the backend already returned, never pretending backend support that doesn't exist.
  const issuesRes = await apiFetch(`/issues?projectId=${project.id}`);
  const allIssues: Issue[] = await issuesRes.json();
  const backlog = allIssues.filter((issue) => issue.sprintId === null);
  const sprintsRes = await apiFetch(`/projects/${project.id}/sprints`, { token });
  const sprints: Sprint[] = await sprintsRes.json();
  const sprintOptions = sprints
    .filter((sprint) => sprint.status !== "completed")
    .map((sprint) => ({ value: String(sprint.id), label: sprint.name }));
  const basePath = `/workspaces/${id}/projects/${project.id}`;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${id}/projects/${project.id}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to project
      </Link>
      <h1 className="text-xl font-semibold">{project.key} -- Backlog</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Every issue not currently in a sprint.
      </p>
      <div className="flex flex-col gap-3">
        {backlog.map((issue) => (
          <Card key={issue.id}>
            <div className="flex items-center justify-between gap-4">
              <Link href={`${basePath}/issues/${issue.id}`}>
              <p className="font-medium">
                {issue.key}: {issue.title}
              </p>
              </Link>
              {sprintOptions.length > 0 && (
                <IssueEditPanel
                  issue={issue}
                  basePath={basePath}
                  fields={[
                    {
                      key: "sprintId",
                      label: "Move to sprint",
                      type: "select",
                      numeric: true,
                      options: [{ value: "", label: "Backlog" }, ...sprintOptions],
                    },
                  ]}
                />
              )}
            </div>
          </Card>
        ))}
        {backlog.length === 0 && (
          <p className="text-sm text-gray-400">Nothing in the backlog.</p>
        )}
      </div>
    </main>
  );
}
