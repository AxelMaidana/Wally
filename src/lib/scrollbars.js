// iOS-like scrollbars: invisible at rest, fade in while you hover a scroll area or
// scroll it, fade out shortly after. Drives the --scrollbar-alpha property used by
// ::-webkit-scrollbar-thumb in index.css.
const VISIBLE_ALPHA = 0.4;
const FADE_MS = 200;
const HIDE_AFTER_SCROLL_MS = 900;

const state = new WeakMap();

const getState = (el) => {
    if (!state.has(el)) state.set(el, { alpha: 0, hovered: false, scrolling: false, frame: 0, timer: 0 });
    return state.get(el);
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const fadeTo = (el, target) => {
    const s = getState(el);
    cancelAnimationFrame(s.frame);
    if (reduceMotion.matches) {
        s.alpha = target;
        el.style.setProperty("--scrollbar-alpha", String(target));
        return;
    }
    const from = s.alpha;
    const start = performance.now();

    const step = (now) => {
        // rAF timestamps can be slightly earlier than performance.now(), so clamp both ends
        const t = Math.min(Math.max((now - start) / FADE_MS, 0), 1);
        s.alpha = from + (target - from) * t;
        el.style.setProperty("--scrollbar-alpha", s.alpha.toFixed(3));
        if (t < 1) s.frame = requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
};

const update = (el) => {
    const s = getState(el);
    fadeTo(el, s.hovered || s.scrolling ? VISIBLE_ALPHA : 0);
};

const isScrollable = (el) => {
    if (el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth) return false;
    const { overflowY, overflowX } = getComputedStyle(el);
    return /auto|scroll/.test(overflowY + overflowX);
};

const scrollableAncestors = (node) => {
    const list = [];
    for (let el = node instanceof Element ? node : null; el; el = el.parentElement) {
        if (isScrollable(el)) list.push(el);
    }
    return list;
};

export const autoHideScrollbars = () => {
    let hovered = [];
    document.addEventListener("pointerover", (event) => {
        const next = scrollableAncestors(event.target);
        hovered.filter((el) => !next.includes(el)).forEach((el) => {
            getState(el).hovered = false;
            update(el);
        });
        next.filter((el) => !hovered.includes(el)).forEach((el) => {
            getState(el).hovered = true;
            update(el);
        });
        hovered = next;
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () => {
        hovered.forEach((el) => {
            getState(el).hovered = false;
            update(el);
        });
        hovered = [];
    });

    document.addEventListener("scroll", (event) => {
        const el = event.target === document ? document.documentElement : event.target;
        if (!(el instanceof Element)) return;
        const s = getState(el);
        if (!s.scrolling) {
            s.scrolling = true;
            update(el);
        }
        clearTimeout(s.timer);
        s.timer = setTimeout(() => {
            s.scrolling = false;
            update(el);
        }, HIDE_AFTER_SCROLL_MS);
    }, { capture: true, passive: true });
};
