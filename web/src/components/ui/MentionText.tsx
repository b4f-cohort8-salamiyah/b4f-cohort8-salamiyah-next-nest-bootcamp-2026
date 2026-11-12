const MENTION_RE = /@\[([^\]]+)\]\(\d+\)/g;

export function MentionText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  MENTION_RE.lastIndex = 0; //@[Lina](1)
  while ((match = MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={key++}
        className="rounded bg-blue-50 px-1 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
      >
        @{match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
