"use client";

import { searchUsersAction } from "@/lib/actions/workspace-members";
import { useEffect, useRef, useState } from "react";

const TRAILING_MENTION_RE = /(?:^|\s)@(\w{0,30})$/;

export function MentionTextarea({
  name,
  workspaceId,
  required = false,
}: {
  name: string;
  workspaceId: number;
  required?: boolean;
}) {
  const [value, setValue] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  function selectUser(user: { id: number; name: string }) {
    if (mentionStart === null || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? value.length;
    const token = `@[${user.name}](${user.id}) `;
    const newValue = value.slice(0, mentionStart) + token + value.slice(cursor);
    pendingCaretRef.current = mentionStart + token.length;
    setValue(newValue);
    setQuery(null);
    setMentionStart(null);
  }

  useEffect(() => {
    if (pendingCaretRef.current === null || !textareaRef.current) return;
    const caret = pendingCaretRef.current;
    pendingCaretRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(caret, caret);
  }, [value]);

  useEffect(() => {
    if (query === null) {
      setResults([]);
      return;
    }
    searchUsersAction(workspaceId, query, true).then(setResults);
  }, [query, workspaceId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    const cursor = e.target.selectionStart ?? text.length;
    setValue(text);

    const match = TRAILING_MENTION_RE.exec(text.slice(0, cursor));
    if (match) {
      setMentionStart(cursor - match[1].length - 1);
      setQuery(match[1]);
    } else {
      setMentionStart(null);
      setQuery(null);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleChange}
        rows={2}
        required={required}
        placeholder="Add a comment... (type @ to mention someone)"
        className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
      />
      {query !== null && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => selectUser(user)}
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {user.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
