// Information sections shared by the landing page ("/") and the dashboard ("/dashboard"):
// How it works, Features, Team, the closing call-to-action and the footer.
// Change them here and both pages update.
import { useState, type ReactNode } from "react";

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

    );
}

export function Features() {
    return (
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
