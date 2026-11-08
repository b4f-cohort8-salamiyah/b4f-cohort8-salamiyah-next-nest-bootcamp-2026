import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string; issueId: string }>;
}) {
  const { id, projectId, issueId } = await params;

  const issueRes = await apiFetch(`/issues/${issueId}`);

  if (!issueRes.ok) {
    notFound();
  }

  const issue: Issue = await issueRes.json();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${id}/projects/${projectId}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to project
      </Link>
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="min-w-0 break-words text-xl font-semibold">
              {issue.key}: {issue.title}
            </h1>
            <StatusBadge status={issue.status} />
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-300">
            {issue.description || "No description provided."}
          </p>
          <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
            <p>Reporter: user #{issue.reporterId}</p>
            <p>
              Assignee:{" "}
              {issue.assigneeId === null ? "unassigned" : `user #${issue.assigneeId}`}
            </p>
          </div>
        </div>
      </Card>
      {/* Resolving real names for reporter/assignee needs GET /users/:id, which requires
          auth -- that arrives in Session 25. Shown by real id for now, not faked. */}
    </main>
  );
}
