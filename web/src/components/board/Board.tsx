"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import type { Issue } from "@/lib/types";
import { updateIssueAction } from "@/lib/actions/issues";
import { BoardColumn } from "./BoardColumn";

const COLUMNS: { status: string; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "review", label: "Review" },
  { status: "done", label: "Done" },
];

export function Board({
  issues: serverIssues,
  basePath,
}: {
  issues: Issue[];
  basePath: string;
}) {
  // A real local, optimistic copy of the server's own list -- moved immediately on drop, rolled
  // back if the real PATCH fails. The server list itself is never mutated directly.
  const [issues, setIssues] = useState(serverIssues);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as number;
    const newStatus = over.id as string;
    const issue = issues.find((i) => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    const previousIssues = issues;
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
    );

    updateIssueAction(issueId, basePath, { status: newStatus }).catch(() => {
      // The real backend rejected this move (e.g. a real 403 -- not this issue's own reporter/
      // assignee/admin/owner) -- the optimistic move is reverted, never left showing a status
      // the server never actually accepted.
      setIssues(previousIssues);
    });
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <BoardColumn
            key={col.status}
            status={col.status}
            label={col.label}
            issues={issues.filter((i) => i.status === col.status)}
            basePath={basePath}
          />
        ))}
      </div>
    </DndContext>
  );
}
