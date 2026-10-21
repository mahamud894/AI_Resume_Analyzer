// Public landing page ("/"). Uses the same design system as the rest of the app
// (Mona Sans, text-gradient headings, primary-gradient buttons, bg-main.svg, white rounded cards)
// and shows a sample report built from the real result-page components.
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import AuthCard, { type AuthMode } from "~/components/AuthCard";
import Summary from "~/components/Summary";
import ScoreCircle from "~/components/ScoreCircle";
import { tokenStorage } from "~/lib/api";
import { useAuthStore } from "~/lib/auth";
import InfoSections, { CallToAction, Footer } from "~/components/LandingSections";

export const meta = () => [
    { title: "Resumind | AI Resume Analyzer" },
    {
        name: "description",
        content:
            "Get an ATS score, detailed AI feedback, a Europass CV and a matching cover letter for your dream job.",
    },
];

// Example numbers for the preview only (clearly labelled "Sample report" on the page)
const SAMPLE_FEEDBACK: Feedback = {
    overallScore: 78,
    ATS: { score: 82, tips: [] },
    toneAndStyle: { score: 85, tips: [] },
    content: { score: 72, tips: [] },
    structure: { score: 64, tips: [] },
    skills: { score: 45, tips: [] },
};

function LandingNav({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    // Phone menu: close on outside tap and on Escape (same behaviour as the app Navbar)
    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e: PointerEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    const sections = [
        { href: "#how-it-works", label: "How it works" },
        { href: "#features", label: "Features" },
        { href: "#team", label: "Team" },
    ];
    const close = () => setMenuOpen(false);

    return (
        <nav className="navbar sticky top-4 z-40 shadow-sm" ref={navRef}>
            <Link to="/" className="flex items-center min-h-11">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
                {sections.map((s) => (
                    <a key={s.href} href={s.href} className="text-dark-200 hover:text-[#606beb] transition-colors">
                        {s.label}
                    </a>
                ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
                <button type="button" onClick={() => onAuth("login")} className="secondary-button">Log In</button>
                <button type="button" onClick={() => onAuth("signup")} className="primary-button w-fit px-6">Get Started</button>
            </div>

            <button type="button"
                    className="md:hidden flex items-center justify-center size-11 -mr-2 rounded-full cursor-pointer hover:bg-gray-50"
                    aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}
                    aria-controls="landing-menu" onClick={() => setMenuOpen((open) => !open)}>
                <svg className="size-6" fill="none" stroke="#475467" strokeWidth={2} strokeLinecap="round"
                     viewBox="0 0 24 24" aria-hidden="true">
                    {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
            </button>

            {menuOpen && (
                <div id="landing-menu"
                     className="md:hidden absolute right-0 top-full mt-2 z-30 w-full flex flex-col gap-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {sections.map((s) => (
                        <a key={s.href} href={s.href} onClick={close}
                           className="min-h-11 flex items-center px-2 rounded-xl text-dark-200 hover:bg-gray-50">
                            {s.label}
                        </a>
                    ))}
                    <div className="h-px bg-gray-100 my-1" />
                    <button type="button" className="primary-button" onClick={() => { close(); onAuth("signup"); }}>Get Started</button>
                    <button type="button" className="secondary-button" onClick={() => { close(); onAuth("login"); }}>Log In</button>
                </div>
            )}
        </nav>
    );
}

// Log in / Sign up popup over the landing page (Escape or a click outside closes it)
function AuthModal({ mode, onClose }: { mode: AuthMode; onClose: () => void }) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKeyDown);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden"; // no page scrolling behind the popup
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = overflow;
        };
    }, [onClose]);

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="auth-title"
             className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto"
             onClick={(e) => e.target === e.currentTarget && onClose()}>
            <AuthCard initialMode={mode} onClose={onClose} />
        </div>
    );
}

export default function Landing() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const [authMode, setAuthMode] = useState<AuthMode | null>(null);
    const openAuth = (mode: AuthMode) => setAuthMode(mode);

    // Logged in → straight to "your resumes", like the home page before the landing page existed
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    // A saved login is still being checked: show the loader instead of flashing the landing page
    if (isLoading && tokenStorage.get()) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover flex items-center justify-center">
                <img src="/images/resume-scan-2.gif" alt="Loading" className="w-[200px]" />
            </main>
        );
    }

    return (
        <main className="page-bg-long">
            <LandingNav onAuth={openAuth} />
            {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />}

            {/* ---------- Hero ---------- */}
            <section className="main-section !pt-12 sm:!pt-20">
                <div className="page-heading animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none">
                    <h1 className="text-balance">Smart feedback for your dream job</h1>
                    <h2 className="max-w-3xl">
                        Upload your resume, paste the job description and get an ATS score, clear tips,
                        a Europass CV and a matching cover letter — all in one place.
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button type="button" onClick={() => openAuth("signup")}
                                className="primary-button sm:w-fit px-8 text-lg font-semibold">
                            Analyze My Resume
                        </button>
                        <a href="#how-it-works" className="secondary-button px-8 text-lg">See How It Works</a>
                    </div>
                </div>

                {/* Sample report: real result-page components with example numbers */}
                <div className="w-full max-w-5xl mt-4 sm:mt-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 motion-reduce:animate-none">
                    <div className="gradient-border shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 sm:gap-6 items-stretch">
                            <div className="relative bg-white rounded-2xl overflow-hidden max-md:hidden">
                                <img src="/images/resume_01.png" alt="Example resume"
                                     className="w-full h-full max-h-[520px] object-cover object-top" />
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 bg-white/95 backdrop-blur rounded-2xl p-3 shadow-md">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">Frontend Developer</p>
                                        <p className="text-sm text-dark-200 truncate">Sample application</p>
                                    </div>
                                    <div className="shrink-0 scale-75 origin-right -my-3">
                                        <ScoreCircle score={SAMPLE_FEEDBACK.overallScore} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 min-w-0">
                                <div className="flex items-center justify-between gap-3 px-1">
                                    <p className="text-lg font-semibold text-gray-900">Resume Review</p>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#606beb] shadow-sm">
                                        Sample report
                                    </span>
                                </div>
                                <Summary feedback={SAMPLE_FEEDBACK} />
                                <div className="flex flex-wrap items-center gap-3 bg-badge-green rounded-2xl px-4 py-3">
                                    <img src="/icons/ats-good.svg" alt="" className="size-8" />
                                    <p className="text-badge-green-text font-semibold">
                                        ATS Score — {SAMPLE_FEEDBACK.ATS.score}/100
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <InfoSections />

            <CallToAction
                title="Ready to see your resume score?"
                text="It takes less than a minute. Upload a PDF and get your first report."
                action={
                    <button type="button" onClick={() => openAuth("signup")}
                            className="primary-button sm:w-fit px-10 text-lg font-semibold">
                        Analyze My Resume
                    </button>
                }
            />

            <Footer />
        </main>
    );
}
