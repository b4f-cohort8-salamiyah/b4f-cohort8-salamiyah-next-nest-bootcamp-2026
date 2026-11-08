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
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <nav className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <Link href="/workspaces" className="text-lg font-semibold">
            B4F Board
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
