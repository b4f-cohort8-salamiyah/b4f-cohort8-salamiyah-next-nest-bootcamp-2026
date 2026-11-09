import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Project, Workspace } from "@/lib/types";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const workspaceRes = await apiFetch(`/workspaces/${id}`);

  if (!workspaceRes.ok) {
    notFound();
  }

  const workspace: Workspace = await workspaceRes.json();

  const projectsRes = await apiFetch("/projects");
  const allProjects: Project[] = await projectsRes.json();
  const projects = allProjects.filter(
    (project) => project.workspaceId === workspace.id,
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">{workspace.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {workspace.description}
        </p>
      </div>

      <WorkspaceSidebar workspace={workspace} projects={projects} />

      <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
        Projects
      </h2>
      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/workspaces/${workspace.id}/projects/${project.id}`}
          >
            <Card>
              <p className="font-medium">
                {project.key} -- {project.name}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
