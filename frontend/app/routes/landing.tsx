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

const STEPS = [
    { title: "Upload your resume", text: "Drop your resume as a PDF. It is stored privately in your account." },
    { title: "Add the job", text: "Paste the company, job title and job description you are applying for." },
    { title: "Get your report", text: "See your overall and ATS score with clear tips on what to fix." },
    { title: "Improve & apply", text: "Generate a Europass CV and a matching cover letter, then download the PDF." },
];

// Simple line icons, drawn in the app's primary colour
const icon = (d: string) => (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="#606beb" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
    </svg>
);

const FEATURES = [
    {
        title: "ATS score",
        text: "See how Applicant Tracking Systems read your resume and which keywords are missing.",
        icon: icon("M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    },
    {
        title: "Detailed feedback",
        text: "Tone & style, content, structure and skills — each scored from 0 to 100 with explanations.",
        icon: icon("M4 19h16M7 16V9m5 7V5m5 11v-4"),
    },
    {
        title: "Europass CV",
        text: "Rebuild your resume in the European Europass format with a report of every improvement.",
        icon: icon("M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"),
    },
    {
        title: "Cover letter",
        text: "A one-page letter matched to the job, in a formal or modern tone. Edit it and download.",
        icon: icon("M4 6h16v12H4zM4 7l8 6 8-6"),
    },
    {
        title: "Application history",
        text: "Every analysis is saved in your dashboard, so you can track all your applications.",
        icon: icon("M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    },
    {
        title: "Private & secure",
        text: "Encrypted passwords, secure login tokens and resumes that only you can open.",
        icon: icon("M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"),
    },
];

// Roles as written in our submitted course reports
const TEAM = [
    { name: "Mahammad Hasan", role: "Team Leader · Frontend Architecture", id: "11220320828", img: "/images/team/mahamud.jpg" },
    { name: "Shanawaz Sakib", role: "Core System Integration Engineer", id: "11220320916", img: "/images/team/sakib.jpg" },
    { name: "Ashikur Rahman Himel", role: "Database Storage & Quality Controller", id: "11220320833", img: "/images/team/himel.jpg" },
    { name: "Rasel Ratul", role: "UI-UX & Tailwind Designer", id: "11220320827", img: "/images/team/ratul.jpg" },
];

const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("");

function TeamPhoto({ name, img }: { name: string; img: string }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="primary-gradient rounded-full p-1 shadow-md">
            {failed ? (
                <div className="size-20 sm:size-24 rounded-full bg-white flex items-center justify-center text-2xl font-semibold text-[#606beb]">
                    {initials(name)}
                </div>
            ) : (
                <img src={img} alt={name} loading="lazy" width={96} height={96}
                     className="size-20 sm:size-24 rounded-full object-cover bg-white border-2 border-white"
                     onError={() => setFailed(true)} />
            )}
        </div>
    );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
    return (
        <div className="flex flex-col items-center gap-3 text-center max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#606beb]">{eyebrow}</span>
            <h2 className="!text-3xl sm:!text-4xl font-semibold text-gradient !leading-tight pb-1 text-balance">{title}</h2>
            {text && <p className="text-dark-200 text-base sm:text-lg">{text}</p>}
        </div>
    );
}

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
        <main className="bg-[url('/images/bg-main.svg')] bg-cover bg-top">
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

            {/* ---------- How it works ---------- */}
            <section id="how-it-works" className="main-section scroll-mt-28">
                <SectionHeading eyebrow="How it works" title="From resume to application in 4 steps" />
                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl">
                    {STEPS.map((step, i) => (
                        <li key={step.title} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                            <span className="primary-gradient size-11 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                                {i + 1}
                            </span>
                            <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                            <p className="text-dark-200">{step.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ---------- Features ---------- */}
            <section id="features" className="main-section scroll-mt-28">
                <SectionHeading eyebrow="Features" title="Everything you need to get hired"
                                text="One account for your resume score, feedback, CV and cover letter." />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-6xl">
                    {FEATURES.map((feature) => (
                        <div key={feature.title}
                             className="group bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none">
                            <span className="gradient-hover size-12 rounded-2xl flex items-center justify-center ring-1 ring-[#a7bff14d]">
                                {feature.icon}
                            </span>
                            <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                            <p className="text-dark-200">{feature.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- Team ---------- */}
            <section id="team" className="main-section scroll-mt-28">
                <SectionHeading eyebrow="Our team" title="Meet Team T05"
                                text="CSE4204 Mobile Computing Lab · Section 8A · Northern University of Business and Technology, Khulna" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl">
                    {TEAM.map((member) => (
                        <div key={member.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col items-center text-center gap-3">
                            <TeamPhoto name={member.name} img={member.img} />
                            <div className="flex flex-col gap-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{member.name}</h3>
                                <p className="text-xs sm:text-sm text-dark-200">{member.role}</p>
                                <p className="text-xs text-gray-400">ID: {member.id}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- Final call to action ---------- */}
            <section className="main-section">
                <div className="gradient-border w-full max-w-4xl shadow-sm">
                    <div className="bg-white rounded-2xl px-6 py-10 sm:p-12 flex flex-col items-center gap-5 text-center">
                        <h2 className="!text-3xl sm:!text-4xl font-semibold text-gradient !leading-tight pb-1">
                            Ready to see your resume score?
                        </h2>
                        <p className="text-dark-200 text-base sm:text-lg max-w-xl">
                            It takes less than a minute. Upload a PDF and get your first report.
                        </p>
                        <button type="button" onClick={() => openAuth("signup")}
                                className="primary-button sm:w-fit px-10 text-lg font-semibold">
                            Analyze My Resume
                        </button>
                    </div>
                </div>
            </section>

            <footer className="px-4 pb-8 pt-2 text-center text-sm text-dark-200">
                © {new Date().getFullYear()} Resumind · Team CSE4204-8A-T05 · NUBTK
            </footer>
        </main>
    );
}
