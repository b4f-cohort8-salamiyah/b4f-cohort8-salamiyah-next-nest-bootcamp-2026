"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import type { Issue } from "@/lib/types";

export function IssueCard({ issue, href }: { issue: Issue; href: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-gray-200 bg-white p-2 text-sm shadow-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Link
        href={href}
        className="font-medium hover:underline"
        // A drag handle and a real link don't mix under dnd-kit's pointer sensor -- stop the
        // pointer event here so clicking the title navigates instead of starting a drag.
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-gray-400">{issue.key}</span> {issue.title}
      </Link>
      {issue.storyPoints !== null && (
        <span
          title="Story points"
          className="w-fit rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          {issue.storyPoints}
        </span>
      )}
    </div>
  );
}
