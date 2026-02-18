import { useState } from "react";
import { AppSidebar } from "./AppSidebar";

const Layout = ({ children }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col md:flex-row bg-white dark:bg-zinc-950 w-full flex-1 mx-auto overflow-hidden h-screen text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
            <AppSidebar open={open} setOpen={setOpen} />
            <div className="flex-1 overflow-y-auto min-h-screen relative">
                <main className="p-8 relative z-10">
                    {children}
                </main>

                <div className="fixed top-0 left-0 -z-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-400/20 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-300/20 blur-[120px] rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
