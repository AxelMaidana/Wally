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
        <div className="flex items-center gap-2 px-1">
            <img
                src={user?.photoURL || "https://ui-avatars.com/api/?name=" + (user?.email || "U")}
                className="h-7 w-7 flex-shrink-0 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                alt="Avatar"
            />
            <div className="flex flex-col items-start justify-center overflow-hidden">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate w-full">
                    {userData?.displayName || user?.displayName || 'Usuario'}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate w-full">
                    {user?.email}
                </span>
            </div>
        </div>
    );

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10 bg-white dark:bg-zinc-950">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="pb-4 flex items-center justify-center w-full">
                        <Link to="/"><Logo /></Link>
                    </div>
                    <div className="mt-8 flex flex-col gap-2">
                        {links.map((link, idx) => (
                            <NavLink
                                key={idx}
                                to={link.href}
                                className={({ isActive }) => cn(
                                    "flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-lg transition-all",
                                    isActive ? "bg-zinc-100 dark:bg-zinc-900 text-primary" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                )}
                            >
                                {link.icon}
                                <span className={cn(
                                    "text-sm font-medium transition-opacity duration-300",
                                    !open && "opacity-0 hidden"
                                )}>
                                    {link.label}
                                </span>
                            </NavLink>
                        ))}
                    </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-1">
                    {open && <UserInfo />}
                    <button
                        onClick={logout}
                        className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors w-full"
                    >
                        <IconLogout className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="text-sm font-medium">Logout</span>}
                    </button>
                    {open && (
                        <div className="flex items-center justify-between px-2 pt-2 text-[9px] text-zinc-400 dark:text-zinc-600 font-medium border-t border-zinc-100 dark:border-zinc-900 mt-2">
                            <Link to="/terms" className="hover:text-primary transition-colors">Términos</Link>
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
                        </div>
                    )}

                </div>
            </SidebarBody>
        </Sidebar>
    );
}
