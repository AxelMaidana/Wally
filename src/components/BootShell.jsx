import { Skeleton } from "./ui/skeleton";

// Shown while the session and profile load. Same geometry as the static boot screen
// in index.html, so a reload goes empty panels -> skeleton -> content without jumping.
export const BootShell = () => {
    const signedIn = document.documentElement.dataset.boot === "app";
    const sidebarCollapsed = document.documentElement.dataset.sidebar === "collapsed";

    if (!signedIn) {
        return (
            <div className="relative min-h-dvh flex items-center justify-center px-4 py-16" role="status">
                <span className="sr-only">Cargando…</span>
                <div className="ambient" aria-hidden="true" />
                <div className="glass-panel relative w-full max-w-[400px] h-[560px] rounded-[2rem] p-8 flex flex-col items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-[18px]" />
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-3.5 w-64" />
                    <Skeleton className="h-12 w-full rounded-2xl mt-6" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full mt-2" />
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-dvh overflow-hidden" role="status">
            <span className="sr-only">Cargando…</span>
            <div className="ambient" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col md:flex-row md:gap-4 md:p-4" aria-hidden="true">
                <aside className={`glass-panel hidden md:flex md:flex-col shrink-0 rounded-[2rem] p-3 ${sidebarCollapsed ? "w-[76px]" : "w-[248px]"}`}>
                    <div className="flex items-center gap-3 px-1.5 pt-1 pb-5">
                        <Skeleton className="w-10 h-10 shrink-0" />
                        {!sidebarCollapsed && (
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3.5 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        {sidebarCollapsed ? (
                            <>
                                <Skeleton className="h-[18px] w-[18px] mx-auto my-3" />
                                <Skeleton className="h-[18px] w-[18px] mx-auto my-3" />
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-3.5 w-1/2 mx-3 my-3" />
                                <Skeleton className="h-3.5 w-2/5 mx-3 my-3" />
                            </>
                        )}
                    </div>
                </aside>
                <div className="glass-panel flex-1 min-h-0 overflow-hidden md:rounded-[2rem] px-4 py-6 md:px-8 md:py-8">
                    <div className="max-w-[1280px] mx-auto flex flex-col gap-6">
                        <div className="space-y-3">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-9 w-56" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="glass-card p-5 space-y-3">
                                    <Skeleton className="h-3.5 w-1/2" />
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            ))}
                        </div>
                        <div className="glass-card h-72" />
                    </div>
                </div>
            </div>
        </div>
    );
};
