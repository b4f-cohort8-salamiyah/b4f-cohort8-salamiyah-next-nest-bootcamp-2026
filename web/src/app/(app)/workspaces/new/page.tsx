import { Card } from "@/components/ui/Card";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";

export default function NewWorkspacePage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <Card>
        <h1 className="mb-4 text-xl font-semibold">Create a workspace</h1>
        <CreateWorkspaceForm />
      </Card>
    </main>
  );
}
