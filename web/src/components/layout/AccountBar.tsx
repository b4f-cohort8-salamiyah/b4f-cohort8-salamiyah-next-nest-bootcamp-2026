"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { logoutAction } from "@/lib/actions/auth";

export function AccountBar() {
  const user = useSelector((state: RootState) => state.currentUser.user);

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-3 border-b border-gray-200 bg-white px-6 py-2 text-sm dark:border-gray-800 dark:bg-gray-900">
      <Link href="/account" className="text-blue-600 hover:underline dark:text-blue-400">
        {user.name}
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="text-gray-500 hover:underline dark:text-gray-400">
          Log out
        </button>
      </form>
    </div>
  );
}
