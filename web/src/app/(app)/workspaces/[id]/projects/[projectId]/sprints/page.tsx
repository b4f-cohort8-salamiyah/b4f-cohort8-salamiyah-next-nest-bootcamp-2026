import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import type { Project, Sprint } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { CreateSprintForm } from "./CreateSprintForm";
import { SprintLifecycleControls } from "./SprintLifecycleControls";

export default async function SprintsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;
  const token = await requireSessionToken();

  const projectRes = await apiFetch(`/projects/${projectId}`);
  if (!projectRes.ok) {
    notFound();
  }
  const project: Project = await projectRes.json();
  const basePath = `/workspaces/${id}/projects/${project.id}`;

  const sprintsRes = await apiFetch(`/projects/${project.id}/sprints`, { token });
  const sprints: Sprint[] = await sprintsRes.json();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link href={basePath} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        Back to project
      </Link>
      <h1 className="text-xl font-semibold">{project.key} -- Sprints</h1>

      <div className="flex flex-col gap-3">
        {sprints.map((sprint) => (
          <Card key={sprint.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{sprint.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sprint.goal || "No goal set."}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {sprint.status} -- {sprint.points.completedPoints}/{sprint.points.totalPoints} points done
                </p>
              </div>
              <SprintLifecycleControls
                sprintId={sprint.id}
                status={sprint.status}
                basePath={basePath}
              />
            </div>
          </Card>
        ))}
        {sprints.length === 0 && (
          <p className="text-sm text-gray-400">No sprints yet.</p>
        )}
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          Create a sprint
        </h2>
        <CreateSprintForm projectId={project.id} basePath={basePath} />
      </Card>
    </main>
  );
}
