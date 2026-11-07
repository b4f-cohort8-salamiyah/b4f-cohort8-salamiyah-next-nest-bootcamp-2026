import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>B4F Board</h1>
      <p>
        <Link href="/workspaces">Browse workspaces</Link>
      </p>
    </main>
  );
}
