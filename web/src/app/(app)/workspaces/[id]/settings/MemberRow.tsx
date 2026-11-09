"use client";

import { useState } from "react";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/workspace-members";

export function MemberRow({
  workspaceId,
  userId,
  name,
  role,
  isOwner,
}: {
  workspaceId: number;
  userId: number;
  name: string;
  role: string;
  isOwner: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function changeRole(newRole: "admin" | "member") {
    setPending(true);
    await updateMemberRoleAction(workspaceId, userId, newRole);
    setPending(false);
  }

  async function remove() {
    setPending(true);
    await removeMemberAction(workspaceId, userId);
    setPending(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
      <span className="font-medium">{name}</span>
      {isOwner ? (
        <span className="text-gray-400">owner</span>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={role}
            disabled={pending}
            onChange={(e) => changeRole(e.target.value as "admin" | "member")}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
