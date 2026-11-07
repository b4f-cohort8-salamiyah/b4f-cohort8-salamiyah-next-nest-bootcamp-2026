import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Project, Workspace } from "@/lib/types";
import Link from "next/link";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workspaceRes = await apiFetch(`/workspaces/${id}`);

  if (workspaceRes.status === 404) {
    notFound();
  }

  const workspace: Workspace = await workspaceRes.json();

  const projectsRes = await apiFetch("/projects");
  const allProjects: Project[] = await projectsRes.json();
  const projects = allProjects.filter(
    (project) => project.workspaceId === workspace.id,
  );

  return (
    <main>
      <h1>{workspace.name}</h1>
      <p>{workspace.description}</p>

      <h2>Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={`/workspaces/${workspace.id}/projects/${project.id}`}>
              {project.key} -- {project.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
