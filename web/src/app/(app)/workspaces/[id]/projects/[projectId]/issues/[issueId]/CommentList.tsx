import { MentionText } from "@/components/ui/MentionText";
import type { Comment } from "@/lib/types";

export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-gray-400">No comments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {comments.map((c) => (
        <li
          key={c.id}
          className="rounded-md bg-gray-50 p-2 text-sm dark:bg-gray-900"
        >
          <p className="font-medium">{c.author?.name ?? "Deleted user"}</p>
          <p className="whitespace-pre-wrap">
            <MentionText text={c.body} />
          </p>
        </li>
      ))}
    </ul>
  );
}
