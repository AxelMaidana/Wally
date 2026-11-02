import React from 'react';

export const Logo = () => (
    <div className="flex items-center gap-2.5 py-1">
        <div className="w-8 h-8 rounded-[10px] bg-ink text-background flex items-center justify-center">
            <span className="font-semibold text-[17px] leading-none">W</span>
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-ink">
            Wally
        </span>
    </div>
);
