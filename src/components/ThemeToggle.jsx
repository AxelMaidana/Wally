import { useState, useEffect } from "react";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") ||
                (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        }
        return "dark";
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

    return (
        <button
            onClick={toggleTheme}
            className="fixed top-6 right-6 z-[101] p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 group"
            aria-label="Toggle Theme"
        >
            {theme === "light" ? (
                <IconMoon className="w-5 h-5 text-zinc-600 group-hover:text-primary transition-colors" />
            ) : (
                <IconSun className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
            )}
        </button>
    );
}
