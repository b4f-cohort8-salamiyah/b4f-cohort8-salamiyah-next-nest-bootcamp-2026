import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Issue, Project } from "@/lib/types";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;

  const projectRes = await apiFetch(`/projects/${projectId}`);

  if (projectRes.status === 404) {
    notFound();
  }

  const project: Project = await projectRes.json();

  const issuesRes = await apiFetch(`/issues?projectId=${project.id}`);
  const issues: Issue[] = await issuesRes.json();

  return (
    <main>
      <p>
        <Link href={`/workspaces/${id}`}>Back to workspace</Link>
      </p>
      <h1>
        {project.key} -- {project.name}
      </h1>
      <p>{project.description}</p>

      <h2>Issues</h2>
      <ul>
        {issues.map((issue) => (
          <li key={issue.id}>
            <Link
              href={`/workspaces/${id}/projects/${project.id}/issues/${issue.id}`}
            >
              {issue.key}: {issue.title} ({issue.status})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
