import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main>
      <h1>Page not found.</h1>
      <p>
        <Link href="/workspaces">Back to workspaces</Link>
      </p>
    </main>
  );
}
