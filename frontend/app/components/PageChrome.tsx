// Shared page frame for the inner pages (result, Europass CV, cover letter), in the same style as the
// landing page and dashboard: a sticky white pill at the top and a gradient page title.
import type { ReactNode } from "react";
import { Link } from "react-router";

// Sticky top bar: "back" link on the left, page actions on the right (hidden when printing)
export function TopBar({ back, children }: { back: { to: string; label: string }; children?: ReactNode }) {
    return (
        <nav className="navbar sticky top-4 z-40 shadow-sm no-print !py-2">
            <div className="flex items-center gap-3 min-w-0">
                <Link to={back.to} className="back-button !rounded-full !border-gray-200 hover:bg-gray-50">
                    <img src="/icons/back.svg" alt="" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold truncate">{back.label}</span>
                </Link>
                <Link to="/dashboard" className="hidden lg:flex items-center min-h-11">
                    <span className="text-xl font-bold text-gradient">RESUMIND</span>
                </Link>
            </div>
            {children && <div className="hidden md:flex flex-row gap-3 flex-wrap justify-end items-center">{children}</div>}
        </nav>
    );
}

// Eyebrow + gradient title + subtitle, left aligned
export function PageTitle({ eyebrow, title, subtitle, children }: {
    eyebrow: string; title: string; subtitle?: ReactNode; children?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 no-print animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#606beb]">{eyebrow}</span>
            <h1 className="!text-3xl sm:!text-4xl lg:!text-5xl !leading-tight pb-1">{title}</h1>
            {subtitle && <p className="text-dark-200 text-base sm:text-lg break-words">{subtitle}</p>}
            {children}
        </div>
    );
}

// White card used for every content block on the inner pages
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <section className={`bg-white rounded-3xl p-5 sm:p-7 shadow-sm ring-1 ring-black/[0.03] ${className}`}>
            {children}
        </section>
    );
}
