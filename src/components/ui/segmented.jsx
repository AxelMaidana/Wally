import { LayoutGroup, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { sidebarSpring } from "@/lib/motion";

// iOS segmented control: the selected pill slides between options
export const Segmented = ({ id, options, value, onChange, className }) => (
    <LayoutGroup id={id}>
        <div
            role="radiogroup"
            className={cn("inline-flex p-1 rounded-full bg-tile border border-hairline", className)}
        >
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "relative h-8 px-3.5 rounded-full text-[13px] transition-colors",
                            selected ? "text-ink font-semibold" : "text-ink-2 font-medium hover:text-ink"
                        )}
                    >
                        {selected && (
                            <motion.span
                                layoutId="segmented-pill"
                                transition={sidebarSpring}
                                className="glass-bubble absolute inset-0 rounded-full"
                            />
                        )}
                        <span className="relative">{option.label}</span>
                    </button>
                );
            })}
        </div>
    </LayoutGroup>
);
