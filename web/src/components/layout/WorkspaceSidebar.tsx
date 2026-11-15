"use client";

import { useState } from "react";
import type { Project, Workspace } from "@/lib/types";
import Link from "next/link";

export function WorkspaceSidebar({
  workspace,
  projects,
}: {
  workspace: Workspace;
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
      >
        {open ? "Close menu" : "Menu"}
      </button>
      {open && (
        <nav className="mt-2 flex flex-col gap-1 rounded-md border border-gray-200 p-2 dark:border-gray-700">
          <Link
            href={`/workspaces/${workspace.id}/settings`}
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Settings
          </Link>
          <p className="mt-1 px-2 text-xs font-semibold uppercase text-gray-400">
            Projects
          </p>
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/workspaces/${workspace.id}/projects/${project.id}`}
              onClick={() => setOpen(false)}
              className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {project.key} -- {project.name}
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="px-2 text-xs text-gray-400">No projects yet.</p>
          )}
        </nav>
      )}
    </div>
  );
}
