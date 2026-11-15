"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";

// The real backend's own DELETE /issues/:id already existed before this session -- the real
// homework gap was only ever the frontend's own missing wiring to it, never a new backend route.
export async function deleteIssueAction(issueId: number, basePath: string) {
  const token = await requireSessionToken();

  const res = await apiFetch(`/issues/${issueId}`, {
    method: "DELETE",
    token,
  });

  if (!res.ok) {
    throw new Error("Could not delete the issue.");
  }

  revalidatePath(basePath);
  redirect(basePath);
}

export interface IssueFormState {
  error?: string;
}

export async function createIssueAction(
  projectId: number,
  basePath: string,
  _prevState: IssueFormState,
  formData: FormData,
): Promise<IssueFormState> {
  const token = await requireSessionToken();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return { error: "Title is required." };
  }

  const res = await apiFetch("/issues", {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, title, description }),
  });

  if (!res.ok) {
    return { error: "Something went wrong. Please try again." };
  }

  const issue: { id: number } = await res.json();
  redirect(`${basePath}/issues/${issue.id}`);
}

// The ONE real generic mutation every real IssueEditPanel field calls -- never a new Server
// Action per field. `data` carries exactly the one (or few) real field(s) that single edit
// touched (e.g. `{ title: "..." }`, or later `{ priority: "high" }`), matching the real backend's
// own `UpdateIssueDto`, which already accepts any subset of its own real fields.
export async function updateIssueAction(
  issueId: number,
  basePath: string,
  data: Record<string, unknown>,
) {
  const token = await requireSessionToken();

  const res = await apiFetch(`/issues/${issueId}`, {
    method: "PATCH",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Could not update the issue.");
  }

  revalidatePath(`${basePath}/issues/${issueId}`);
  revalidatePath(`${basePath}/board`);
  revalidatePath(`${basePath}/backlog`);
  revalidatePath(`${basePath}/sprints`);
  revalidatePath(basePath);
  return res.json();
}
