import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Sidebar, SidebarBody } from "./ui/sidebar";
import {
    IconLayoutDashboard,
    IconHistory,
    IconSettings,
    IconLogout,
    IconCode,
} from "@tabler/icons-react";
import { Logo } from "./common/Logo";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export function AppSidebar({ open, setOpen }) {
    const { user, userData, logout, isAdmin } = useAuth();

    const links = [
        {
            label: "Dashboard",
            href: "/",
            icon: <IconLayoutDashboard className="h-5 w-5 flex-shrink-0" />,
        },
        {
            label: "History",
            href: "/history",
            icon: <IconHistory className="h-5 w-5 flex-shrink-0" />,
        },
    ];

    if (isAdmin) {
        links.push({
            label: "Desarrollo",
            href: "/dev",
            icon: <IconCode className="h-5 w-5 flex-shrink-0 text-primary" />,
        });
    }

    links.push({
        label: "Settings",
        href: "/settings",
        icon: <IconSettings className="h-5 w-5 flex-shrink-0" />,
    });

    const UserInfo = () => (
        <div className={cn(
            "flex items-center w-full",
            !open ? "justify-center" : "gap-3 px-2"
        )}>
            <div className="relative flex-shrink-0">
                <img
                    src={user?.photoURL || "https://ui-avatars.com/api/?name=" + (user?.email || "U")}
                    className="h-9 w-9 flex-shrink-0 rounded-xl object-cover border-2 border-zinc-100 dark:border-zinc-800 shadow-sm"
                    alt="Avatar"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-950 rounded-full shadow-sm" />
            </div>
            <AnimatePresence mode="wait">
                {open && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-start justify-center overflow-hidden"
                    >
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate w-full tracking-tight">
                            {userData?.displayName || user?.displayName || 'Usuario'}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500 truncate w-full">
                            {user?.email}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-8 bg-card border-r border-border">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-2">
                    <div className={cn(
                        "pb-8 flex items-center w-full",
                        !open ? "justify-center" : "px-4"
                    )}>
                        <Link to="/" className="hover:scale-105 transition-transform">
                            <Logo collapsed={!open} />
                        </Link>
                    </div>

                    <div className={cn(
                        "flex flex-col gap-1.5 px-2",
                        !open ? "items-center" : ""
                    )}>
                        {links.map((link, idx) => (
                            <NavLink
                                key={idx}
                                to={link.href}
                                className={({ isActive }) => cn(
                                    "relative flex items-center rounded-xl transition-colors duration-200 group/item",
                                    !open ? "justify-center w-12 h-12" : "gap-3 py-2.5 px-3 w-full",
                                    isActive
                                        ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                                        : "text-muted-foreground hover:bg-secondary font-medium"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={cn(
                                            "flex-shrink-0 transition-colors duration-200",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
                                        )}>
                                            {link.icon}
                                        </div>
                                        <AnimatePresence>
                                            {open && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-sm tracking-tight whitespace-nowrap"
                                                >
                                                    {link.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </div>

                <div className="border-t border-border p-4 flex flex-col gap-4">
                    <UserInfo />

                    <button
                        onClick={logout}
                        className={cn(
                            "flex items-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200",
                            !open ? "justify-center w-12 h-12 mx-auto" : "gap-3 py-2.5 px-3"
                        )}
                    >
                        <div className="flex-shrink-0">
                            <IconLogout className="h-5 w-5" />
                        </div>
                        <AnimatePresence>
                            {open && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm font-bold tracking-tight"
                                >
                                    Cerrar Sesión
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center justify-between px-2 text-[10px] text-muted-foreground font-bold border-t border-border pt-3 mt-1"
                            >
                                <Link to="/terms" className="hover:text-primary transition-colors">Términos</Link>
                                <span className="opacity-20">•</span>
                                <Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SidebarBody>
        </Sidebar>
    );
};
