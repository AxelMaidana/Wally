import React from 'react';

export const Logo = ({ collapsed = false }) => (
    <div className="flex items-center gap-3 group cursor-pointer py-1">
        <div className="w-9 h-9 min-w-9 min-h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-all duration-300">
            <span className="text-white font-bold text-xl">W</span>
        </div>
        {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors duration-300 animate-in fade-in slide-in-from-left-2 duration-300">
                Wally
            </span>
        )}
    </div>
);
