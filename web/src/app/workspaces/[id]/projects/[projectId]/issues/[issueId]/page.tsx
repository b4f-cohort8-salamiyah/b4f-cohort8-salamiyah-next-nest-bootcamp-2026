import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue } from "@/lib/types";

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
    <main>
      <p>
        <Link href={`/workspaces/${id}/projects/${projectId}`}>Back to project</Link>
      </p>
      <h1>
        {issue.key}: {issue.title}
      </h1>
      <p>Status: {issue.status}</p>
      <p>{issue.description}</p>
      <p>Reporter: user #{issue.reporterId}</p>
      <p>
        Assignee:{" "}
        {issue.assigneeId === null ? "unassigned" : `user #${issue.assigneeId}`}
      </p>
      {/* Resolving real names for reporter/assignee needs GET /users/:id, which requires
          auth -- that arrives in Session 25. Shown by real id for now, not faked. */}
    </main>
  );
}
