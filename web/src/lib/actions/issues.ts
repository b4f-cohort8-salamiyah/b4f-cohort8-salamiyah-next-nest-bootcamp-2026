"use server";

import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  return res.json();
}
