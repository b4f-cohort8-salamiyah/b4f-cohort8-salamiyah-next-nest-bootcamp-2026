import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import type { Workspace } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { AddMemberForm } from "./AddMemberForm";
import { MemberRow } from "./MemberRow";

type Member = {
  userId: number;
  role: string;
  user: { id: number; name: string };
};

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspaceId = Number(id);
  const token = await requireSessionToken();

  const workspaceRes = await apiFetch(`/workspaces/${workspaceId}`, { token });
  if (!workspaceRes.ok) {
    notFound();
  }
  const workspace: Workspace = await workspaceRes.json();

  const membersRes = await apiFetch(`/workspaces/${workspaceId}/members`, {
    token,
  });
  const members: Member[] = await membersRes.json();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Link
        href={`/workspaces/${workspaceId}`}
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        Back to workspace
      </Link>
      <h1 className="text-xl font-semibold">{workspace.name} -- Settings</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          Members
        </h2>
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              workspaceId={workspaceId}
              userId={member.userId}
              name={member.user.name}
              role={member.role}
              isOwner={member.userId === workspace.ownerId}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          Add a member
        </h2>
        <AddMemberForm workspaceId={workspaceId} />
      </Card>
    </main>
  );
}
