const MENTION_RE = /@\[([^\]]+)\]\((\d+)\)/g;

export function extractMentionedUserIds(body: string): number[] {
  const ids = new Set<number>();

  for (const match of body.matchAll(MENTION_RE)) {
    ids.add(Number(match[2]));
  }

  return [...ids];
}
