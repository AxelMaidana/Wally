import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { DesktopSidebar, MobileSidebar } from "./ui/sidebar";
import { sidebarSpring } from "../lib/motion";
import {
    IconLayoutDashboard,
    IconHistory,
    IconUserCircle,
    IconLogout,
    IconCode,
} from "@tabler/icons-react";
import { Logo } from "./common/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const COLLAPSED_KEY = "sidebar-collapsed";

// Labels fade and slide while the panel width springs; icons never move
const Label = ({ collapsed, children, className }) => (
    <AnimatePresence initial={false}>
        {!collapsed && (
            <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.06, duration: 0.18 } }}
                exit={{ opacity: 0, x: -6, transition: { duration: 0.1 } }}
                className={cn("whitespace-nowrap", className)}
            >
                {children}
            </motion.span>
        )}
    </AnimatePresence>
);

const SidebarContent = ({ collapsed, onNavigate }) => {
    const { user, userData, logout, isAdmin } = useAuth();
    const [hovered, setHovered] = useState(null);

    const links = [
        { label: "Resumen", href: "/", icon: IconLayoutDashboard },
        { label: "Movimientos", href: "/history", icon: IconHistory },
    ];
    links.push({ label: "Perfil", href: "/profile", icon: IconUserCircle });
    if (isAdmin) links.push({ label: "Desarrollo", href: "/dev", icon: IconCode });

    const displayName = userData?.display_name || user?.user_metadata?.full_name || "Usuario";
    const avatar = userData?.photo_url || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(displayName)}`;

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex items-center gap-3 px-1.5 pt-1 pb-5">
                <img src={avatar} className="h-10 w-10 shrink-0 rounded-full object-cover" alt="" />
                <Label collapsed={collapsed} className="min-w-0 flex flex-col">
                    <span className="text-[15px] font-semibold text-ink truncate">{displayName}</span>
                    <span className="text-xs text-ink-2 truncate">{user?.email}</span>
                </Label>
            </div>

            <nav className="flex flex-col gap-0.5 flex-1" onMouseLeave={() => setHovered(null)}>
                {links.map(({ label, href, icon: Icon }) => (
                    <NavLink
                        key={href}
                        to={href}
                        end
                        onClick={onNavigate}
                        onMouseEnter={() => setHovered(href)}
                        onFocus={() => setHovered(href)}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) => cn(
                            "relative flex items-center gap-3 h-10 px-[17px] rounded-full text-sm transition-colors",
                            isActive ? "text-ink font-semibold" : "text-ink-2 font-medium hover:text-ink"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-active"
                                        transition={sidebarSpring}
                                        className="glass-bubble absolute inset-0 rounded-full"
                                    />
                                )}
                                <AnimatePresence>
                                    {hovered === href && !isActive && (
                                        <motion.span
                                            layoutId="nav-hover"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={sidebarSpring}
                                            className="absolute inset-0 rounded-full bg-tile"
                                        />
                                    )}
                                </AnimatePresence>
                                <Icon className="relative h-[18px] w-[18px] shrink-0" stroke={1.75} />
                                <Label collapsed={collapsed} className="relative">{label}</Label>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="flex flex-col gap-0.5 pt-3 border-t border-hairline">
                <ThemeToggle variant="row" collapsed={collapsed} className="px-[17px]" />
                <button
                    type="button"
                    onClick={logout}
                    title={collapsed ? "Cerrar sesión" : undefined}
                    className="flex items-center gap-3 h-10 px-[17px] rounded-full text-sm font-medium text-ink-2 hover:bg-tile hover:text-gasto transition-colors"
                >
                    <IconLogout className="h-[18px] w-[18px] shrink-0" stroke={1.75} />
                    <Label collapsed={collapsed}>Cerrar sesión</Label>
                </button>
                <Label collapsed={collapsed} className="flex gap-4 px-[17px] pt-3 text-xs text-ink-3">
                    <Link to="/terms" onClick={onNavigate} className="hover:text-ink">Términos</Link>
                    <Link to="/privacy" onClick={onNavigate} className="hover:text-ink">Privacidad</Link>
                </Label>
            </div>
        </div>
    );
};

export function AppSidebar({ open, setOpen }) {
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(COLLAPSED_KEY) === "true";
        } catch {
            return false;
        }
    });

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            try {
                localStorage.setItem(COLLAPSED_KEY, String(!prev));
            } catch {
                // Storage can be unavailable (private mode); the toggle still works for this visit
            }
            return !prev;
        });
    };

    return (
        <>
            <DesktopSidebar collapsed={collapsed} onToggle={toggleCollapsed}>
                <LayoutGroup id="sidebar-desktop">
                    <SidebarContent collapsed={collapsed} />
                </LayoutGroup>
            </DesktopSidebar>
            <MobileSidebar open={open} setOpen={setOpen} header={<Link to="/"><Logo /></Link>}>
                <LayoutGroup id="sidebar-mobile">
                    <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
                </LayoutGroup>
            </MobileSidebar>
        </>
    );
};
