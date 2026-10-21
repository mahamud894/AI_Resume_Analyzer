// Information sections shared by the landing page ("/") and the dashboard ("/dashboard"):
// How it works, Features, Team, the closing call-to-action and the footer.
// Change them here and both pages update.
import { useId, useState, type ReactNode } from "react";

// Simple line icons, drawn in the app's primary colour
const icon = (d: string, className = "size-6", stroke = "#606beb") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
    </svg>
);

const ICONS = {
    upload: "M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2",
    job: "M9 6V5a2 2 0 012-2h2a2 2 0 012 2v1M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2zM4 12h16",
    report: "M4 19h16M7 16V9m5 7V5m5 11v-4",
    improve: "M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
    ats: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    cv: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
    letter: "M4 6h16v12H4zM4 7l8 6 8-6",
    history: "M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    lock: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4",
    check: "M5 13l4 4L19 7",
    cross: "M6 6l12 12M18 6L6 18",
};

const scoreColor = (score: number) =>
    score > 70 ? { bar: "bg-green-500", text: "text-green-600" }
        : score > 49 ? { bar: "bg-yellow-500", text: "text-yellow-600" }
            : { bar: "bg-red-500", text: "text-red-600" };

// ---------- Small decorative previews (aria-hidden: they only illustrate the text) ----------

const previewBox = "rounded-2xl bg-gradient-to-b from-[#f5f7ff] to-white ring-1 ring-[#e6ebff] p-3 h-28 flex flex-col justify-center gap-2";

function UploadPreview() {
    return (
        <div className={previewBox} aria-hidden="true">
            <div className="flex items-center gap-3">
                <img src="/images/pdf.png" alt="" className="size-9 object-contain" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">my-resume.pdf</p>
                    <p className="text-xs text-gray-400">1.2 MB · uploaded</p>
                </div>
                <span className="size-6 rounded-full bg-badge-green flex items-center justify-center">
                    {icon(ICONS.check, "size-3.5", "#16a34a")}
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-full rounded-full primary-gradient" />
            </div>
        </div>
    );
}

function JobPreview() {
    return (
        <div className={previewBox} aria-hidden="true">
            {[["Company", "Acme Tech"], ["Job title", "Frontend Developer"]].map(([label, value]) => (
                <div key={label} className="flex items-center gap-2 rounded-lg bg-white ring-1 ring-gray-100 px-2.5 py-1.5 text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-700 truncate">{value}</span>
                </div>
            ))}
            <div className="flex flex-col gap-1 px-1">
                <span className="h-1.5 w-full rounded-full bg-gray-200/80" />
                <span className="h-1.5 w-2/3 rounded-full bg-gray-200/80" />
            </div>
        </div>
    );
}

// Small score ring in the app's pink → blue gradient (same colours as ScoreCircle)
function MiniRing({ score, className = "size-16" }: { score: number; className?: string }) {
    const id = useId();
    const r = 22, c = 2 * Math.PI * r;
    return (
        <svg viewBox="0 0 56 56" className={`${className} -rotate-90 shrink-0`}>
            <defs>
                <linearGradient id={id} x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF97AD" />
                    <stop offset="100%" stopColor="#5171FF" />
                </linearGradient>
            </defs>
            <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="28" cy="28" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
        </svg>
    );
}

function ReportPreview() {
    return (
        <div className={`${previewBox} !flex-row items-center !gap-3`} aria-hidden="true">
            <MiniRing score={78} />
            <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-sm font-semibold text-gray-800">78<span className="text-gray-400">/100</span></p>
                <span className="w-fit rounded-full bg-badge-green px-2 py-0.5 text-[11px] font-semibold text-green-700">ATS 82 · Strong</span>
                <span className="w-fit rounded-full bg-badge-yellow px-2 py-0.5 text-[11px] font-semibold text-yellow-700">3 tips to fix</span>
            </div>
        </div>
    );
}

function ImprovePreview() {
    const Doc = ({ label, blue }: { label: string; blue?: boolean }) => (
        <div className="relative flex-1 h-full rounded-lg bg-white ring-1 ring-gray-200 p-2 flex flex-col gap-1 shadow-sm">
            <span className={`h-1.5 w-1/2 rounded-full ${blue ? "bg-[#0b4ea2]" : "bg-gray-700"}`} />
            <span className={`h-px w-full ${blue ? "bg-[#0b4ea2]/40" : "bg-gray-200"} mb-0.5`} />
            {[100, 80, 90, 60].map((w, i) => (
                <span key={i} className="h-1 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
            ))}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200">
                {label}
            </span>
        </div>
    );
    return (
        <div className={`${previewBox} !flex-row !gap-3 !pb-4`} aria-hidden="true">
            <Doc label="Europass CV" blue />
            <Doc label="Cover letter" />
        </div>
    );
}

const STEPS = [
    { title: "Upload your resume", text: "Drop your resume as a PDF. It is stored privately in your account.", icon: ICONS.upload, preview: <UploadPreview /> },
    { title: "Add the job", text: "Paste the company, job title and job description you are applying for.", icon: ICONS.job, preview: <JobPreview /> },
    { title: "Get your report", text: "See your overall and ATS score with clear tips on what to fix.", icon: ICONS.report, preview: <ReportPreview /> },
    { title: "Improve & apply", text: "Generate a Europass CV and a matching cover letter, then download the PDF.", icon: ICONS.improve, preview: <ImprovePreview /> },
];

const cardHover =
    "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-16px_rgba(96,107,235,0.35)] motion-reduce:transform-none";

// Roles as in the README (section 2. Team Engineering Roster & Roles)
const TEAM = [
    { name: "Mahammad Hasan", role: "Team Leader / Frontend Developer + UI/UX Designer", id: "11220320828", img: "/images/team/mahamud.jpg" },
    { name: "Shanawaz Sakib", role: "Core System Integration Engineer", id: "11220320916", img: "/images/team/sakib.jpg" },
    { name: "Ashikur Rahman Himel", role: "Database Storage & Quality Controller", id: "11220320833", img: "/images/team/himel.jpg" },
    { name: "Rasel Ratul", role: "Backend Developer", id: "11220320827", img: "/images/team/ratul.jpg" },
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

export function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
    return (
        <div className="flex flex-col items-center gap-3 text-center max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#606beb]">{eyebrow}</span>
            <h2 className="!text-3xl sm:!text-4xl font-semibold text-gradient !leading-tight pb-1 text-balance">{title}</h2>
            {text && <p className="text-dark-200 text-base sm:text-lg">{text}</p>}
        </div>
    );
}


export function HowItWorks() {
    return (
        <section id="how-it-works" className="main-section scroll-mt-28">
            <SectionHeading eyebrow="How it works" title="From resume to application in 4 steps" />
            <ol className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full max-w-6xl">
                {/* The journey line joining the step badges (behind the cards, visible in the gaps) */}
                <span aria-hidden="true"
                      className="hidden lg:block absolute left-[8%] right-[8%] top-[52px] h-[3px] rounded-full bg-gradient-to-r from-[#8e98ff] via-[#FF97AD] to-[#606beb]" />
                <span aria-hidden="true"
                      className="sm:hidden absolute left-[51px] top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-[#8e98ff] via-[#FF97AD] to-[#606beb]" />
                {STEPS.map((step, i) => (
                    <li key={step.title}
                        className={`group relative z-10 bg-white rounded-3xl p-6 shadow-sm ring-1 ring-black/[0.03] flex flex-col gap-4 overflow-hidden ${cardHover}`}>
                        {/* Big faded step number in the corner */}
                        <span aria-hidden="true"
                              className="absolute -top-2 right-3 text-[5.5rem] leading-none font-bold text-[#606beb]/[0.07] select-none transition-colors duration-300 group-hover:text-[#606beb]/[0.14]">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="primary-gradient size-14 rounded-2xl flex items-center justify-center ring-4 ring-white shadow-[0_10px_24px_-8px_rgba(96,107,235,0.7)] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                                {icon(step.icon, "size-7", "white")}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-widest text-[#606beb]">Step {i + 1}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                            <p className="text-dark-200">{step.text}</p>
                        </div>
                        <div className="mt-auto">{step.preview}</div>
                    </li>
                ))}
            </ol>
        </section>
    );
}

// Feature card shell: icon, title, text, then an optional visual
function FeatureCard({ title, text, iconPath, className = "", dark = false, children }: {
    title: string; text: string; iconPath: string; className?: string; dark?: boolean; children?: ReactNode;
}) {
    return (
        <div className={`group relative overflow-hidden rounded-3xl p-6 sm:p-7 flex flex-col gap-5 shadow-sm ring-1 ${cardHover} ${
            dark ? "bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] ring-white/10 text-white"
                 : "bg-white ring-black/[0.03]"} ${className}`}>
            {/* soft colour glow in the corner, brighter on hover */}
            <span aria-hidden="true"
                  className={`pointer-events-none absolute -right-20 -top-20 size-56 rounded-full blur-3xl transition-opacity duration-500 ${
                      dark ? "bg-[#FF97AD]/30 opacity-60 group-hover:opacity-100" : "bg-[#8e98ff]/20 opacity-70 group-hover:opacity-100"}`} />
            <div className="relative flex flex-col gap-3">
                <span className={`size-12 rounded-2xl flex items-center justify-center ${
                    dark ? "bg-white/10 ring-1 ring-white/20" : "gradient-hover ring-1 ring-[#a7bff14d]"}`}>
                    {icon(iconPath, "size-6", dark ? "white" : "#606beb")}
                </span>
                <h3 className={`text-xl font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{title}</h3>
                <p className={dark ? "text-indigo-100" : "text-dark-200"}>{text}</p>
            </div>
            {children && <div className="relative mt-auto" aria-hidden="true">{children}</div>}
        </div>
    );
}

const Chip = ({ ok, children }: { ok: boolean; children: ReactNode }) => (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? "bg-badge-green text-badge-green-text" : "bg-badge-red text-badge-red-text"}`}>
        {icon(ok ? ICONS.check : ICONS.cross, "size-3", ok ? "#16a34a" : "#dc2626")}
        {children}
    </span>
);

export function Features() {
    const bars = [["Tone & Style", 85], ["Content", 72], ["Structure", 64], ["Skills", 45]] as const;
    const history = [["A", "Acme Tech", "Frontend Developer", 81], ["N", "Northwind", "Full Stack Developer", 68], ["B", "Blue Ocean IT", "React Developer", 52]] as const;

    return (
        <section id="features" className="main-section scroll-mt-28">
            <SectionHeading eyebrow="Features" title="Everything you need to get hired"
                            text="One account for your resume score, feedback, CV and cover letter." />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-6xl">

                {/* ATS score — wide card with keyword check */}
                <FeatureCard title="ATS score" iconPath={ICONS.ats} className="md:col-span-2"
                             text="See how Applicant Tracking Systems read your resume and which keywords from the job are missing.">
                    <div className="rounded-2xl bg-[#f7f8ff] ring-1 ring-[#e6ebff] p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-gray-700">Keyword match</span>
                            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-green-600 shadow-sm">82/100</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {["React", "TypeScript", "REST API", "Git", "Tailwind"].map((k) => <Chip key={k} ok>{k}</Chip>)}
                            {["Docker", "CI/CD"].map((k) => <Chip key={k} ok={false}>{k}</Chip>)}
                        </div>
                    </div>
                </FeatureCard>

                {/* Detailed feedback — tall card with the four category scores */}
                <FeatureCard title="Detailed feedback" iconPath={ICONS.report} className="lg:row-span-2"
                             text="Tone & style, content, structure and skills — each scored from 0 to 100 with explanations.">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8ff] ring-1 ring-[#e6ebff] p-4">
                            <div className="relative">
                                <MiniRing score={78} className="size-20" />
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">78</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-gray-800">Overall score</span>
                                <span className="w-fit rounded-full bg-badge-green px-2.5 py-0.5 text-xs font-semibold text-green-700">Strong</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {bars.map(([label, score]) => (
                                <div key={label} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700">{label}</span>
                                        <span className={`font-semibold ${scoreColor(score).text}`}>{score}</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div className={`h-full rounded-full ${scoreColor(score).bar} transition-[width] duration-700`}
                                             style={{ width: `${score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 rounded-xl bg-badge-green px-3 py-2 text-sm text-badge-green-text">
                                <img src="/icons/check.svg" alt="" className="size-4" /> Strong action verbs
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-badge-yellow px-3 py-2 text-sm text-badge-yellow-text">
                                <img src="/icons/warning.svg" alt="" className="size-4" /> Add measurable results
                            </div>
                        </div>
                    </div>
                </FeatureCard>

                {/* Europass CV — mini CV sheet */}
                <FeatureCard title="Europass CV" iconPath={ICONS.cv}
                             text="Rebuild your resume in the European Europass format, with a report of every improvement.">
                    <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-sm p-3 flex flex-col gap-2 rotate-[-1.5deg] transition-transform duration-300 group-hover:rotate-0">
                        <div className="flex items-center gap-2 border-b-2 border-[#0b4ea2] pb-2">
                            <span className="h-2 w-16 rounded-full bg-[#0b4ea2]" />
                            <span className="h-2.5 w-24 rounded-full bg-gray-800 ml-auto" />
                        </div>
                        {[0, 1].map((row) => (
                            <div key={row} className="grid grid-cols-[30%_1fr] gap-2 items-start">
                                <span className="h-1.5 w-3/4 justify-self-end rounded-full bg-[#0b4ea2]/50 mt-0.5" />
                                <div className="flex flex-col gap-1">
                                    <span className="h-1.5 w-full rounded-full bg-gray-300" />
                                    <span className="h-1.5 w-4/5 rounded-full bg-gray-200" />
                                </div>
                            </div>
                        ))}
                        <span className="w-fit ml-[32%] rounded-full bg-[#eef3fb] px-2 py-0.5 text-[10px] font-semibold text-[#0b4ea2]">EQF level 6</span>
                    </div>
                </FeatureCard>

                {/* Cover letter — mini letter + tone switch */}
                <FeatureCard title="Cover letter" iconPath={ICONS.letter}
                             text="A one-page letter matched to the job, in a formal or modern tone. Edit it and download.">
                    <div className="flex flex-col gap-3">
                        <div className="w-fit inline-flex gap-1 rounded-full bg-[#eef3fb] p-1 text-xs font-semibold">
                            <span className="rounded-full bg-[#0b4ea2] px-3 py-1 text-white">Formal</span>
                            <span className="rounded-full px-3 py-1 text-[#0b4ea2]">Modern</span>
                        </div>
                        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-sm p-3 flex flex-col gap-1.5 rotate-[1.5deg] transition-transform duration-300 group-hover:rotate-0">
                            <span className="text-[11px] font-semibold text-gray-700">Dear Hiring Manager,</span>
                            {[100, 95, 85, 100, 60].map((w, i) => (
                                <span key={i} className="h-1.5 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
                            ))}
                        </div>
                    </div>
                </FeatureCard>

                {/* Application history — wide card with a mini dashboard list */}
                <FeatureCard title="Application history" iconPath={ICONS.history} className="lg:col-span-2"
                             text="Every analysis is saved in your dashboard, so you can track all your applications in one place.">
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 gap-3">
                        {history.map(([letter, company, role, score]) => (
                            <div key={company} className="flex items-center gap-3 rounded-2xl bg-[#f7f8ff] ring-1 ring-[#e6ebff] p-3">
                                <span className="primary-gradient size-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold text-white">
                                    {letter}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{company}</p>
                                    <p className="text-xs text-gray-400 truncate">{role}</p>
                                </div>
                                <span className={`text-sm font-bold ${scoreColor(score).text}`}>{score}</span>
                            </div>
                        ))}
                    </div>
                </FeatureCard>

                {/* Private & secure — dark accent card */}
                <FeatureCard title="Private & secure" iconPath={ICONS.lock} dark className="md:col-span-2 lg:col-span-1"
                             text="Your resumes and reports belong to you.">
                    <ul className="flex flex-col gap-2.5">
                        {["Passwords encrypted with bcrypt", "Secure login tokens (JWT)", "Files only you can open"].map((item) => (
                            <li key={item} className="flex items-center gap-2.5 text-sm text-indigo-50">
                                <span className="size-5 shrink-0 rounded-full bg-white/15 flex items-center justify-center">
                                    {icon(ICONS.check, "size-3", "white")}
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </FeatureCard>
            </div>
        </section>
    );
}

export function Team() {
    return (
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

    );
}

// Closing banner; `action` is the button (a popup trigger on the landing page, a link on the dashboard)
export function CallToAction({ title, text, action }: { title: string; text: string; action: ReactNode }) {
    return (
        <section className="main-section">
            <div className="gradient-border w-full max-w-4xl shadow-sm">
                <div className="bg-white rounded-2xl px-6 py-10 sm:p-12 flex flex-col items-center gap-5 text-center">
                    <h2 className="!text-3xl sm:!text-4xl font-semibold text-gradient !leading-tight pb-1 text-balance">
                        {title}
                    </h2>
                    <p className="text-dark-200 text-base sm:text-lg max-w-xl">{text}</p>
                    {action}
                </div>
            </div>
        </section>
    );
}

export function Footer() {
    return (
    <footer className="px-4 pb-8 pt-2 text-center text-sm text-dark-200">
        © {new Date().getFullYear()} Resumind · Team CSE4204-8A-T05 · NUBTK
    </footer>
    );
}

// How it works + Features + Team, in this order
export default function InfoSections() {
    return (
        <>
            <HowItWorks />
            <Features />
            <Team />
        </>
    );
}
