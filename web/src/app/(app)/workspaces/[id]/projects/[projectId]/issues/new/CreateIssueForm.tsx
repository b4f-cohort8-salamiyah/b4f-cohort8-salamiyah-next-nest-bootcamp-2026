"use client";

import { useActionState } from "react";
import { createIssueAction, type IssueFormState } from "@/lib/actions/issues";

const initialState: IssueFormState = {};

export function CreateIssueForm({
  projectId,
  basePath,
}: {
  projectId: number;
  basePath: string;
}) {
  const action = createIssueAction.bind(null, projectId, basePath);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          name="title"
          type="text"
          required
          className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          rows={3}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create issue"}
      </button>
    </form>
  );
}
