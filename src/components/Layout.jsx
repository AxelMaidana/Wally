import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { WallyBot } from "./Chat/WallyBot";

const Layout = ({ children }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative h-dvh overflow-hidden text-ink">
            <div className="ambient" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col md:flex-row md:gap-4 md:p-4">
                <AppSidebar open={open} setOpen={setOpen} />
                <div className="glass-panel flex-1 min-h-0 overflow-y-auto md:rounded-[2rem]">
                    <main className="px-4 py-6 md:px-8 md:py-8">
                        {children}
                    </main>
                </div>
            </div>
            <WallyBot />
        </div>
    );
};

export default Layout;
