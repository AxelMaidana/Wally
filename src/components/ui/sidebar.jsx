import { cn } from "@/lib/utils";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX, IconChevronLeft } from "@tabler/icons-react";
import { sidebarSpring } from "@/lib/motion";

export const DesktopSidebar = ({ className, children, collapsed, onToggle }) => {
    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 76 : 248 }}
            transition={sidebarSpring}
            className={cn(
                "glass-panel relative hidden md:flex md:flex-col shrink-0 rounded-[2rem] p-3",
                className
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="glass-panel absolute -right-3 top-7 z-10 w-6 h-6 rounded-full flex items-center justify-center text-ink-2 hover:text-ink"
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                aria-expanded={!collapsed}
            >
                <motion.span
                    initial={false}
                    animate={{ rotate: collapsed ? 180 : 0 }}
                    transition={sidebarSpring}
                    className="flex"
                >
                    <IconChevronLeft className="w-3.5 h-3.5" stroke={2.25} />
                </motion.span>
            </button>
            {children}
        </motion.aside>
    );
};

export const MobileSidebar = ({ className, children, header, open, setOpen }) => {
    return (
        <div className="glass-panel md:hidden flex items-center justify-between h-14 px-4 border-x-0 border-t-0">
            {header}
            <button
                type="button"
                className="p-2 -mr-2 rounded-full text-ink hover:bg-tile"
                onClick={() => setOpen(!open)}
                aria-label="Abrir menú"
            >
                <IconMenu2 className="h-5 w-5" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.98 }}
                        transition={sidebarSpring}
                        className={cn(
                            "glass-panel fixed inset-2 z-[100] rounded-[2rem] p-4 flex flex-col",
                            className
                        )}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 p-2 rounded-full text-ink hover:bg-tile"
                            onClick={() => setOpen(false)}
                            aria-label="Cerrar menú"
                        >
                            <IconX className="h-5 w-5" />
                        </button>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
