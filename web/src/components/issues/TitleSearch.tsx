"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function TitleSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTitle = searchParams.get("title") ?? "";

  // Same real pattern as StatusFilter -- pushed into the URL's own searchParams, so the Server
  // Component re-fetches with the real backend's own `title` substring filter.
  function setTitle(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("title", value);
    } else {
      params.delete("title");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="text"
      defaultValue={currentTitle}
      onChange={(e) => setTitle(e.target.value)}
      placeholder="Search by title..."
      className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
    />
  );
}
