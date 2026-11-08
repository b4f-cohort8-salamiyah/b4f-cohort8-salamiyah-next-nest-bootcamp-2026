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
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">
            {issue.key}: {issue.title}
          </h1>
          <StatusBadge status={issue.status} />
        </div>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {issue.description}
        </p>
        <div className="mt-4 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Reporter: user #{issue.reporterId}</span>
          <span>
            Assignee:{" "}
            {issue.assigneeId === null
              ? "unassigned"
              : `user #${issue.assigneeId}`}
          </span>
        </div>
      </Card>
    </main>
  );
}
