import { cn } from "@/lib/utils";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, setOpen]);

    return (
        <div className="glass-panel md:hidden flex items-center justify-between shrink-0 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-4 border-x-0 border-t-0">
            {header}
            <button
                type="button"
                className="p-2 -mr-2 rounded-full text-ink active:bg-tile"
                onClick={() => setOpen(!open)}
                aria-label="Abrir menú"
                aria-expanded={open}
            >
                <IconMenu2 className="h-5 w-5" />
            </button>
            {/* Portaled to <body>: the bar's backdrop-filter would otherwise become the drawer's
                containing block and squeeze the "fixed" drawer into the 56px bar */}
            {createPortal(
                <AnimatePresence>
                    {open && (
                        <div className="md:hidden fixed inset-0 z-[100]">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 bg-black/25"
                                onClick={() => setOpen(false)}
                                aria-hidden="true"
                            />
                            <motion.div
                                initial={{ x: "-105%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-105%" }}
                                transition={sidebarSpring}
                                className={cn(
                                    "glass-panel absolute left-2 top-[calc(0.5rem+env(safe-area-inset-top))] bottom-[calc(0.5rem+env(safe-area-inset-bottom))] w-[min(300px,calc(100vw-4rem))] rounded-[2rem] p-4 flex flex-col",
                                    className
                                )}
                                role="dialog"
                                aria-modal="true"
                                aria-label="Menú"
                            >
                                <button
                                    type="button"
                                    className="absolute right-3 top-3 z-10 p-2 rounded-full text-ink-2 active:bg-tile"
                                    onClick={() => setOpen(false)}
                                    aria-label="Cerrar menú"
                                >
                                    <IconX className="h-5 w-5" />
                                </button>
                                {children}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
