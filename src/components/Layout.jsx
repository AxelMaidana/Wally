import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { AppSidebar } from "./AppSidebar";
import { WallyBot } from "./Chat/WallyBot";
import { iosEase } from "../lib/motion";

const Layout = ({ children }) => {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    return (
        <div className="relative h-dvh overflow-hidden text-ink">
            <div className="ambient" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col md:flex-row md:gap-4 md:p-4">
                <AppSidebar open={open} setOpen={setOpen} />
                {/* Remounts per route, so each view resets its scroll and eases in */}
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: iosEase }}
                    className="glass-panel flex-1 min-h-0 overflow-y-auto md:rounded-[2rem]"
                >
                    <main className="px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:py-8">
                        {children}
                    </main>
                </motion.div>
            </div>
            <WallyBot />
        </div>
    );
};

export default Layout;
