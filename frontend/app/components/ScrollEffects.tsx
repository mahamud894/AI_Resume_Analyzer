// Scroll effects for the landing page and the dashboard.
// Every element with a `data-reveal` attribute fades/slides in the first time it scrolls into view
// (styles in app.css → "Scroll effects"). Optional stagger: style={reveal(index)}.
//
// Safe by design:
//  - the page is fully visible without JavaScript; elements are only hidden once this has run
//  - nothing is hidden for visitors who asked their system for reduced motion
//  - elements added later (e.g. resume cards after loading) are picked up too
//  - anything already scrolled past is shown as well, so nothing can stay hidden
import { type CSSProperties, useEffect } from "react";

export const reveal = (index = 0, step = 90): CSSProperties =>
    ({ "--reveal-delay": `${index * step}ms` } as CSSProperties);

export default function ScrollEffects() {
    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) return;

        const root = document.documentElement;
        root.classList.add("reveal-ready");

        // Reveal everything that is inside the screen or already scrolled past (so a jump to
        // "#team" never leaves hidden cards above it). Runs at most once per frame.
        let frame = 0;
        const check = () => {
            frame = 0;
            const limit = window.innerHeight - 40;
            document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((el) => {
                if (el.getBoundingClientRect().top < limit) el.classList.add("is-visible");
            });
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };

        check();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        // Elements added later (e.g. resume cards after loading)
        const mutations = new MutationObserver(schedule);
        mutations.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            mutations.disconnect();
            if (frame) cancelAnimationFrame(frame);
            root.classList.remove("reveal-ready");
        };
    }, []);

    return null;
}
