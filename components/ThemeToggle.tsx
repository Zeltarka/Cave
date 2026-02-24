"use client";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            aria-label="Changer le thème"
            className="p-2 rounded-lg border border-[#24586f] bg-background text-foreground transition-colors hover:bg-[#24586f] hover:text-white"
        >
            {theme === "light" ? "🌙" : "☀️"}
        </button>
    );
}