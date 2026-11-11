"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { requireSessionToken } from "@/lib/session";

export interface SprintFormState {
  error?: string;
}

export async function createSprintAction(
  projectId: number,
  basePath: string,
  _prevState: SprintFormState,
  formData: FormData,
): Promise<SprintFormState> {
  const token = await requireSessionToken();
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const res = await apiFetch(`/projects/${projectId}/sprints`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, goal }),
  });

  if (!res.ok) {
    return { error: "Something went wrong. Please try again." };
  }

  revalidatePath(`${basePath}/sprints`);
  revalidatePath(`${basePath}/backlog`);
  return {};
}

export async function startSprintAction(sprintId: number, basePath: string) {
  const token = await requireSessionToken();

  const res = await apiFetch(`/sprints/${sprintId}/start`, {
    method: "POST",
    token,
  });

  if (!res.ok) {
    const body: { message?: string } = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Could not start the sprint.");
  }

  revalidatePath(`${basePath}/sprints`);
  revalidatePath(`${basePath}/backlog`);
  revalidatePath(`${basePath}/board`);
}

export async function completeSprintAction(sprintId: number, basePath: string) {
  const token = await requireSessionToken();

  const res = await apiFetch(`/sprints/${sprintId}/complete`, {
    method: "POST",
    token,
  });

  if (!res.ok) {
    const body: { message?: string } = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Could not complete the sprint.");
  }

  revalidatePath(`${basePath}/sprints`);
  revalidatePath(`${basePath}/backlog`);
  revalidatePath(`${basePath}/board`);
}
