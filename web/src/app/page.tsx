import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">B4F Board</h1>
      <Link
        href="/workspaces"
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        Browse workspaces
      </Link>
    </main>
  );
}
