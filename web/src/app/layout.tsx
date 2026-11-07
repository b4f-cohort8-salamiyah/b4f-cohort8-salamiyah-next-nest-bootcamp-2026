import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "B4F Board",
  description: "B4F Board -- workspaces, projects, and issues.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/workspaces">Workspaces</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}