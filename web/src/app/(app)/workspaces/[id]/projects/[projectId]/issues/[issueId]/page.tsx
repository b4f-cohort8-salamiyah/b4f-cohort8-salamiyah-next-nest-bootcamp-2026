import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import type { Issue } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

// Resolving a real id into a real name needs GET /users/:id, which requires auth -- not
// available until this session. A missing/removed user (reporterId/assigneeId still points at
// a row that no longer resolves) falls back to the raw id rather than breaking the whole page.
async function resolveName(
  id: number | null,
  token: string,
): Promise<string | null> {
  if (id === null) return null;
  const res = await apiFetch(`/users/${id}`, { token });
  if (!res.ok) return `user #${id}`;
  const user: { name: string } = await res.json();
  return user.name;
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string; issueId: string }>;
}) {
  const { id, projectId, issueId } = await params;
  const token = await requireSessionToken();

  const issueRes = await apiFetch(`/issues/${issueId}`);

  if (!issueRes.ok) {
    notFound();
  }

  const issue: Issue = await issueRes.json();
  const [reporterName, assigneeName] = await Promise.all([
    resolveName(issue.reporterId, token),
    resolveName(issue.assigneeId, token),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${id}/projects/${projectId}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to project
      </Link>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{issue.title}</h1>
          <StatusBadge status={issue.status} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {issue.description}
        </p>
        <div className="mt-4 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Reporter: {reporterName ?? "unknown"}</span>
          <span>Assignee: {assigneeName ?? "unassigned"}</span>
        </div>
      </Card>
    </main>
  );
}
