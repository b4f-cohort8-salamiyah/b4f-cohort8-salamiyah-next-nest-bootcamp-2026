import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue } from "@/lib/types";
import Link from "next/link";

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
        <Link href={`/workspaces/${id}/projects/${projectId}`}>
          Back to project
        </Link>
      </p>
      <h1>
        {issue.key}: {issue.title}
      </h1>
      <p>{issue.description}</p>
      <ul>
        <li>Status: {issue.status}</li>
        <li>Assignee id: {issue.assigneeId ?? "Unassigned"}</li>
        <li>Reporter id: {issue.reporterId}</li>
        <li>Created: {issue.createdAt}</li>
      </ul>
    </main>
  );
}
