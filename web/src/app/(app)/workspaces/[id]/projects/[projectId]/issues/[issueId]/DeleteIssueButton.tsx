"use client";

import { useState } from "react";
import { deleteIssueAction } from "@/lib/actions/issues";

export function DeleteIssueButton({
  issueId,
  basePath,
}: {
  issueId: number;
  basePath: string;
}) {
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!confirm("Delete this issue? This cannot be undone.")) return;
    setPending(true);
    try {
      await deleteIssueAction(issueId, basePath);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={remove}
      className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      Delete issue
    </button>
  );
}
