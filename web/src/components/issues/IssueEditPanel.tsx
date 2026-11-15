"use client";

import { useState } from "react";
import type { Issue } from "@/lib/types";
import { updateIssueAction } from "@/lib/actions/issues";

// One real generic row type, driven entirely by `fields` -- adding a new editable Issue field
// (priority, assignee, story points, ...) never means writing a new component; it means adding
// one more entry to the `fields` array passed in below. "text" and "select" are the two real row
// kinds LIVE taught (title, status); HOMEWORK's own priority/assignee fields are mechanical
// transfer of "select," never a new kind. "number" (story points) is the one genuinely new real
// row kind, needed because a story-points value must reach the backend as a real number, never
// a string -- `numeric` on a "select" row (assignee) asks for that same real number-or-null
// conversion from an option list, rather than duplicating it as its own fourth kind.
export type EditableField =
  | { key: keyof Issue; label: string; type: "text" }
  | {
      key: keyof Issue;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      numeric?: boolean;
    }
  | { key: keyof Issue; label: string; type: "number" };

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
        <EditableRow key={String(field.key)} issue={issue} basePath={basePath} field={field} />
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
  const [error, setError] = useState<string>();

  async function save(newValue: string) {
    const previousValue = value;
    setValue(newValue);
    setPending(true);
    setError(undefined);
    // Real numeric fields (story points; assignee, a nullable foreign key) must reach the
    // backend as a real number or `null`, never the raw string every HTML form control actually
    // produces -- `@IsInt()` on the real DTO rejects a numeric-looking string outright.
    const numeric = field.type === "number" || (field.type === "select" && field.numeric);
    const payload = numeric ? (newValue === "" ? null : Number(newValue)) : newValue;
    try {
      await updateIssueAction(issue.id, basePath, { [field.key]: payload });
    } catch (e) {
      setValue(previousValue);
      setError(e instanceof Error ? e.message : "Could not update this field.");
    } finally {
      setPending(false);
    }
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{field.label}</span>
      {field.type === "text" || field.type === "number" ? (
        <input
          type={field.type}
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
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
