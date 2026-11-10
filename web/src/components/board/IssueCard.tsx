"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Issue } from "@/lib/types";
import Link from "next/link";

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
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-gray-400">{issue.key}</span> {issue.title}
      </Link>
    </div>
  );
}