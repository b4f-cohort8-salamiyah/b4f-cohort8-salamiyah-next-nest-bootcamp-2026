"use client";

import { useActionState } from "react";
import {
  createCommentAction,
  type CommentFormState,
} from "@/lib/actions/comments";
import { MentionTextarea } from "@/components/ui/MentionTextarea";

const initialState: CommentFormState = {};

export function CommentForm({
  issueId,
  workspaceId,
  basePath,
}: {
  issueId: number;
  workspaceId: number;
  basePath: string;
}) {
  const action = createCommentAction.bind(null, issueId, basePath);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <MentionTextarea name="body" workspaceId={workspaceId} required />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
