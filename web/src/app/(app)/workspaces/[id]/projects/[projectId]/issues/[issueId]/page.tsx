import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import type { Issue, Project } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { IssueEditPanel } from "@/components/issues/IssueEditPanel";
import { DeleteIssueButton } from "./DeleteIssueButton";

type Member = { userId: number; role: string; user: { id: number; name: string } };

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
  const reporterName = await resolveName(issue.reporterId, token);

  // The real assignee options are this issue's own real workspace's real members -- the
  // identical real membership list Workspace Settings (Session 25) already fetches, reused here
  // rather than a second, separate "who can be assigned" lookup.
  const projectRes = await apiFetch(`/projects/${projectId}`, { token });
  const project: Project = await projectRes.json();
  const membersRes = await apiFetch(`/workspaces/${project.workspaceId}/members`, { token });
  const members: Member[] = await membersRes.json();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${id}/projects/${projectId}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to project
      </Link>
      <Card>
        <IssueEditPanel
          issue={issue}
          basePath={`/workspaces/${id}/projects/${projectId}`}
          fields={[
            { key: "title", label: "Title", type: "text" },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "todo", label: "To do" },
                { value: "in_progress", label: "In progress" },
                { value: "review", label: "Review" },
                { value: "done", label: "Done" },
              ],
            },
            {
              key: "priority",
              label: "Priority",
              type: "select",
              options: [
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ],
            },
            {
              key: "assigneeId",
              label: "Assignee",
              type: "select",
              numeric: true,
              options: [
                { value: "", label: "Unassigned" },
                ...members.map((m) => ({
                  value: String(m.userId),
                  label: m.user.name,
                })),
              ],
            },
            { key: "storyPoints", label: "Story points", type: "number" },
          ]}
        />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {issue.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Reporter: {reporterName ?? "unknown"}</span>
          <DeleteIssueButton
            issueId={issue.id}
            basePath={`/workspaces/${id}/projects/${projectId}`}
          />
        </div>
      </Card>
    </main>
  );
}
