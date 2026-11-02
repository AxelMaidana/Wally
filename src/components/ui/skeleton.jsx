import { cn } from "@/lib/utils";

// Decorative placeholder; the container announces the loading state
export const Skeleton = ({ className, style, onTint = false }) => (
    <span
        aria-hidden="true"
        className={cn("skeleton block", onTint && "skeleton-on-tint", className)}
        style={style}
    />
);
