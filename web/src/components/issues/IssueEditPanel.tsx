"use client";

import { updateIssueAction } from "@/lib/actions/issues";
import type { Issue } from "@/lib/types";
import { useState } from "react";

export type EditableField =
  | { key: keyof Issue; label: string; type: "text" }
  | { key: keyof Issue; label: string; type: "select"; options: { value: string; label: string }[] };

export function IssueEditPanel({
  issue,
  basePath,
  fields,
}: {
  issue: Issue;
  basePath: string;
  fields: EditableField[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((field) => (
        <EditableRow
          key={String(field.key)}
          issue={issue}
          basePath={basePath}
          field={field}
        />
      ))}
    </div>
  );
}

function EditableRow({
  issue,
  basePath,
  field,
}: {
  issue: Issue;
  basePath: string;
  field: EditableField;
}) {
  const [value, setValue] = useState(String(issue[field.key] ?? ""));
  const [pending, setPending] = useState(false);

  async function save(newValue: string) {
    setValue(newValue);
    setPending(true);
    try {
      await updateIssueAction(issue.id, basePath, { [field.key]: newValue });
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{field.label}</span>
      {field.type === "text" ? (
        <input
          type="text"
          value={value}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => save(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1 dark:border-gray-600 dark:bg-gray-800"
        />
      ) : (
        <select
          value={value}
          disabled={pending}
          onChange={(e) => save(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
