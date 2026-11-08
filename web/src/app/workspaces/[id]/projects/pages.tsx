import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Project, Workspace } from "@/lib/types";

export default async function ProjectsPage() {
  const res = await apiFetch("/projects");
  const projects: Project[] = await res.json();

  return (
    <main>
      <h1>Projects</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
            >
              {project.key} -- {project.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
