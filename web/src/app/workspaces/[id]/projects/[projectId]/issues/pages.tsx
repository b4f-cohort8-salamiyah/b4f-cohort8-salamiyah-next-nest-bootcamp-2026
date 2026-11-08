import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Project, Workspace } from "@/lib/types";
import { Issue } from "next/dist/build/swc/types";

export default async function IssuesPage() {
  const res = await apiFetch("/issues");
  const issues: Issue[] = await res.json();

  return (
    <main>
      <h1>Issues</h1>
      <ul>
        {issues.map((issue) => (
          <li key={issue.id}>
            <Link
              href={`/workspaces/${issue.workspaceId}/projects/${issue.projectId}/issues/${issue.id}`}
            >
              {issue.key} -- {issue.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
