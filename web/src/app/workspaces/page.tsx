import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Workspace } from "@/lib/types";

export default async function WorkspacesPage() {
  const res = await apiFetch("/workspaces");
  const workspaces: Workspace[] = await res.json();

  return (
    <main>
      <h1>Workspaces</h1>
      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <Link href={`/workspaces/${workspace.id}`}>{workspace.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
