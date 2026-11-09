"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";

export interface MemberFormState {
  error?: string;
}

// Called directly from the Client Component below (not bound to a <form>) -- a real
// user-search-as-you-type needs a plain async call, not a form submission.
export async function searchUsersAction(workspaceId: number, q: string) {
  if (q.trim().length < 2) return [];
  const token = await requireSessionToken();
  const res = await apiFetch(
    `/users/search?q=${encodeURIComponent(q)}&workspaceId=${workspaceId}`,
    { token },
  );
  if (!res.ok) return [];
  return res.json() as Promise<{ id: number; name: string; email: string }[]>;
}

export async function addMemberAction(
  workspaceId: number,
  _prevState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const token = await requireSessionToken();
  const userId = Number(formData.get("userId"));
  const role = String(formData.get("role") ?? "member");

  if (!userId) {
    return { error: "Pick a real user to add first." };
  }

  const res = await apiFetch(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });

  if (!res.ok) {
    if (res.status === 409) {
      return { error: "That user is already a member of this workspace." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath(`/workspaces/${workspaceId}/settings`);
  return {};
}

export async function updateMemberRoleAction(
  workspaceId: number,
  userId: number,
  role: "admin" | "member",
) {
  const token = await requireSessionToken();

  await apiFetch(`/workspaces/${workspaceId}/members/${userId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  revalidatePath(`/workspaces/${workspaceId}/settings`);
}

export async function removeMemberAction(workspaceId: number, userId: number) {
  const token = await requireSessionToken();

  await apiFetch(`/workspaces/${workspaceId}/members/${userId}`, {
    method: "DELETE",
    token,
  });

  revalidatePath(`/workspaces/${workspaceId}/settings`);
}
