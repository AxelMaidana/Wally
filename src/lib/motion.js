// Shared spring for the sidebar and its pills: quick, with a small iOS-like settle
export const sidebarSpring = { type: "spring", stiffness: 380, damping: 34, mass: 0.8 };

// Softer spring for things that grow into place (chart bars, chat bubbles)
export const softSpring = { type: "spring", stiffness: 260, damping: 26 };

// iOS's standard deceleration curve
export const iosEase = [0.32, 0.72, 0, 1];
