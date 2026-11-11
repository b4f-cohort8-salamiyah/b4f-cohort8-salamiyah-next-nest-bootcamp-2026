"use client";

import { useActionState } from "react";
import { createSprintAction, type SprintFormState } from "@/lib/actions/sprints";

const initialState: SprintFormState = {};

export function CreateSprintForm({
  projectId,
  basePath,
}: {
  projectId: number;
  basePath: string;
}) {
  const action = createSprintAction.bind(null, projectId, basePath);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          type="text"
          required
          placeholder="Sprint 1"
          className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Goal (optional)
        <input
          name="goal"
          type="text"
          className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create sprint"}
      </button>
    </form>
  );
}
