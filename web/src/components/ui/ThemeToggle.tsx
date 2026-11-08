"use client";

import { useTheme } from "@/context/themeContext";
import { Button } from "./Button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button onClick={toggleTheme}>
      Switch to {theme === "light" ? "dark" : "light"} mode
    </Button>
  );
}
