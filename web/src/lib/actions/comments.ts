"use server";

import { requireSessionToken } from "@/lib/session";
import { apiFetch } from "../api";
import { revalidatePath } from "next/cache";

export interface CommentFormState {
  error?: string;
}

export async function createCommentAction(
  issueId: number,
  basePath: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const token = await requireSessionToken();
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return { error: "Comment cannot be empty." };
  }

  const res = await apiFetch(`/issues/${issueId}/comments`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath(basePath);
  return {};
}
