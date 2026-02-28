import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { WallyBot } from "./Chat/WallyBot";

const Layout = ({ children }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row bg-white dark:bg-zinc-950 w-full flex-1 mx-auto overflow-hidden h-screen text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
            <AppSidebar open={open} setOpen={setOpen} />
            <div className="flex-1 overflow-y-auto min-h-screen relative bg-background">
                <main className="p-4 md:p-8 relative z-10">
                    {children}
                </main>
                <WallyBot />
            </div>
        </div>
    );
};

export default Layout;
