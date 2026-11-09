"use client";

import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-gray-300 px-3 py-1 text-sm dark:border-gray-600"
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
