"use client";

import { useState } from "react";
import Link from "next/link";
import type { Issue } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";

type SortKey = "title" | "key";

export function SortableIssueList({
  issues,
  basePath,
}: {
  issues: Issue[];
  basePath: string;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("key");

  // Client-derived sort over the ALREADY real-filtered issues -- the real backend has no sort
  // parameter at all; inventing one would mean pretending support that doesn't exist.
  const sorted = [...issues].sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        Sort by
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="key">Key</option>
          <option value="title">Title</option>
        </select>
      </label>
      {sorted.map((issue) => (
        <Link key={issue.id} href={`${basePath}/issues/${issue.id}`}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-medium">
                {issue.key}: {issue.title}
              </p>
              <StatusBadge status={issue.status} />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
