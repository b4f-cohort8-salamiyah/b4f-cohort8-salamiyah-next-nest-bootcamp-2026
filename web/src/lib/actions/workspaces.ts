"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";

export interface WorkspaceFormState {
  error?: string;
}

export async function createWorkspaceAction(
  _prevState: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const token = await requireSessionToken();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !slug) {
    return { error: "Name and slug are required." };
  }

  const res = await apiFetch("/workspaces", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug, description }),
  });

  if (!res.ok) {
    if (res.status === 409) {
      return { error: `A workspace with slug "${slug}" already exists.` };
    }
    return { error: "Something went wrong. Please try again." };
  }

  const workspace: { id: number } = await res.json();
  redirect(`/workspaces/${workspace.id}`);
}
