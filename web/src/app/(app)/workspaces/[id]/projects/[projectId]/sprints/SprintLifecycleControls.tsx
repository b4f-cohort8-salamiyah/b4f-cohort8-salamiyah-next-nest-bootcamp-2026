"use client";

import { useState } from "react";
import { startSprintAction, completeSprintAction } from "@/lib/actions/sprints";

// Forward-only: "planned" only ever offers Start; "active" only ever offers Complete;
// "completed" offers neither -- the real backend's own forward-only lifecycle guard (Sprint can
// never go active -> planned or completed -> active) is mirrored here, never contradicted, even
// though the real enforcement lives server-side (SprintsService), not in this component.
export function SprintLifecycleControls({
  sprintId,
  status,
  basePath,
}: {
  sprintId: number;
  status: string;
  basePath: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function start() {
    setPending(true);
    setError(undefined);
    try {
      await startSprintAction(sprintId, basePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the sprint.");
    } finally {
      setPending(false);
    }
  }

  async function complete() {
    setPending(true);
    setError(undefined);
    try {
      await completeSprintAction(sprintId, basePath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete the sprint.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {status === "planned" && (
        <button
          type="button"
          disabled={pending}
          onClick={start}
          className="rounded-md border border-blue-600 px-2 py-1 text-xs font-medium text-blue-600 disabled:opacity-50 dark:text-blue-400"
        >
          Start sprint
        </button>
      )}
      {status === "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={complete}
          className="rounded-md border border-green-600 px-2 py-1 text-xs font-medium text-green-600 disabled:opacity-50 dark:text-green-400"
        >
          Complete sprint
        </button>
      )}
    </div>
  );
}
