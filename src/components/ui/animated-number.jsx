import { useLayoutEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

// Counts from the previous value to the new one, like the iOS Wallet balance.
// Writes to the DOM directly so it doesn't re-render React on every frame.
export const AnimatedNumber = ({ value, format, className }) => {
    const ref = useRef(null);
    const previous = useRef(0);
    const reduceMotion = useReducedMotion();

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;

        const from = previous.current;
        previous.current = value;

        if (reduceMotion || from === value) {
            node.textContent = format(value);
            return;
        }

        const controls = animate(from, value, {
            duration: 0.9,
            ease: [0.32, 0.72, 0, 1],
            onUpdate: (latest) => { node.textContent = format(latest); }
        });
        return () => controls.stop();
    }, [value, format, reduceMotion]);

    return <span ref={ref} className={className} />;
};
