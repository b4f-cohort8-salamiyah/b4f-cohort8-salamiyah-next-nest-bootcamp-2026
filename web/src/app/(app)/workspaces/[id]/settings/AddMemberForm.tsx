"use client";

import { useState } from "react";
import {
  addMemberAction,
  searchUsersAction,
} from "@/lib/actions/workspace-members";

type SearchResult = { id: number; name: string; email: string };

export function AddMemberForm({ workspaceId }: { workspaceId: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [role, setRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function search(value: string) {
    setQuery(value);
    setSelected(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setResults(await searchUsersAction(workspaceId, value));
  }

  async function submit(formData: FormData) {
    if (!selected) return;
    setPending(true);
    setError(undefined);
    const result = await addMemberAction(workspaceId, {}, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setQuery("");
    setSelected(null);
    setResults([]);
  }

  return (
    <form action={submit} className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600">
          <span>
            <strong>{selected.name}</strong>{" "}
            <span className="text-gray-400">{selected.email}</span>
          </span>
          <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setSelected(null)}>
            Change
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search by name or email..."
            className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          {results.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-md border border-gray-200 p-1 dark:border-gray-700">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setSelected(user);
                      setResults([]);
                    }}
                  >
                    {user.name} <span className="text-gray-400">{user.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <input type="hidden" name="userId" value={selected?.id ?? ""} />
      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value as "admin" | "member")}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={!selected || pending}
        className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
      >
        Add member
      </button>
    </form>
  );
}
