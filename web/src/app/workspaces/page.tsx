import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Workspace } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export default async function WorkspacesPage() {
  const res = await apiFetch("/workspaces");
  const workspaces: Workspace[] = await res.json();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Workspaces</h1>
      <div className="flex flex-col gap-3">
        {workspaces.map((workspace) => (
          <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
            <Card>
              <p className="font-medium">{workspace.name}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
