import { Card } from "@/components/ui/Card";
import { CreateIssueForm } from "./CreateIssueForm";

export default async function NewIssuePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;
  const basePath = `/workspaces/${id}/projects/${projectId}`;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Create an issue</h1>
        <CreateIssueForm projectId={Number(projectId)} basePath={basePath} />
      </Card>
    </main>
  );
}
