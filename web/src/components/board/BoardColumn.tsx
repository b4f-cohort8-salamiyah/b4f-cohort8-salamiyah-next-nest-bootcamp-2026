"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Issue } from "@/lib/types";
import { IssueCard } from "./IssueCard";

export function BoardColumn({
  status,
  label,
  issues,
  basePath,
}: {
  status: string;
  label: string;
  issues: Issue[];
  basePath: string;
}) {
  // The column itself is the real drop zone, id'd by its own status so onDragEnd can read the
  // new status directly off `over.id` -- no separate id-to-status lookup table needed.
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-64 flex-shrink-0 flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
        {label} <span className="text-gray-400">({issues.length})</span>
      </h3>
      <div
        ref={setNodeRef}
        className={`flex min-h-20 flex-col gap-2 rounded-lg p-1 transition-colors ${
          isOver ? "bg-blue-50 dark:bg-blue-950/40" : ""
        }`}
      >
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} href={`${basePath}/issues/${issue.id}`} />
        ))}
        {issues.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400 dark:border-gray-800">
            No issues
          </p>
        )}
      </div>
    </div>
  );
}
