import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { cn } from "../lib/utils";

const knobSpring = { type: "spring", stiffness: 600, damping: 32 };

// iOS-style switch, used in the sidebar row
const Switch = ({ on }) => (
    <span
        className={cn(
            "relative inline-flex w-[38px] h-[23px] shrink-0 rounded-full p-[2px] transition-colors duration-200",
            on ? "bg-[#34c759]" : "bg-tile-strong"
        )}
        aria-hidden="true"
    >
        <motion.span
            initial={false}
            animate={{ x: on ? 15 : 0 }}
            transition={knobSpring}
            className="w-[19px] h-[19px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
        />
    </span>
);

export function ThemeToggle({ className, variant = "floating", collapsed = false }) {
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

    const isDark = theme === "dark";
    const toggleTheme = () => setTheme(isDark ? "light" : "dark");
    const Icon = isDark ? IconMoon : IconSun;

    if (variant === "row") {
        return (
            <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={toggleTheme}
                title={collapsed ? "Modo oscuro" : undefined}
                className={cn(
                    "relative flex items-center gap-3 h-10 px-[11px] rounded-full text-sm font-medium text-ink-2 hover:text-ink transition-colors",
                    className
                )}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={theme}
                        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex shrink-0"
                    >
                        <Icon className="w-[18px] h-[18px]" stroke={1.75} />
                    </motion.span>
                </AnimatePresence>
                {!collapsed && (
                    <>
                        <span className="flex-1 text-left whitespace-nowrap">Modo oscuro</span>
                        <Switch on={isDark} />
                    </>
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={cn(
                "glass-card w-10 h-10 flex items-center justify-center rounded-full text-ink-2 hover:text-ink transition-colors",
                className
            )}
            aria-label={isDark ? "Modo claro" : "Modo oscuro"}
        >
            <Icon className="w-[18px] h-[18px]" stroke={1.75} />
        </button>
    );
}
