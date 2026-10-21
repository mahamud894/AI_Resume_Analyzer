// Step-by-step progress for long tasks (upload + analysis, Europass rewrite, cover letter, scoring).
// Replaces the old scanning GIF.
//
// `current` = index of the running step when the page knows it (e.g. upload → analyze).
// Without it, steps advance on time using each step's `after` (seconds) — used for single AI requests,
// where the server does several things in one call. The last step ("Done") is only reached when the
// page sets `current` to it, so the bar never claims success too early.
import { useEffect, useState } from "react";

export type Step = { label: string; detail?: string; after?: number };

export default function ProgressSteps({ title, steps, current }: { title: string; steps: Step[]; current?: number }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const started = Date.now();
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
        return () => clearInterval(timer);
    }, []);

    const timedIndex = steps.reduce((idx, step, i) =>
        i < steps.length - 1 && step.after !== undefined && elapsed >= step.after ? i : idx, 0);
    const active = current ?? timedIndex;
    const finished = active >= steps.length - 1;
    // Progress inside the bar: completed steps + a slowly growing share of the running one
    const percent = finished ? 100 : Math.min(95, ((active + Math.min(0.85, elapsed / 40)) / (steps.length - 1)) * 100);

    return (
        <div className="no-print w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-sm ring-1 ring-black/[0.03] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300"
             role="status" aria-live="polite">
            <div className="flex items-center gap-4">
                <span className="relative size-14 shrink-0 rounded-2xl primary-gradient flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(96,107,235,0.7)]">
                    {finished ? (
                        <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <span className="size-7 rounded-full border-[3px] border-white/40 border-t-white animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    )}
                </span>
                <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-dark-200">{finished ? "All done" : `${steps[active].label}… · ${elapsed}s`}</p>
                </div>
            </div>

            <div className="h-2 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full primary-gradient transition-[width] duration-700 ease-out" style={{ width: `${percent}%` }} />
            </div>

            <ol className="flex flex-col gap-3">
                {steps.map((step, i) => {
                    const state = i < active || finished ? "done" : i === active ? "active" : "todo";
                    return (
                        <li key={step.label} className="flex items-start gap-3">
                            <span className={`mt-0.5 size-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                state === "done" ? "bg-badge-green text-green-700"
                                    : state === "active" ? "bg-[#eef0ff] text-[#606beb] ring-2 ring-[#8e98ff]"
                                        : "bg-gray-100 text-gray-400"}`}>
                                {state === "done" ? "✓" : i + 1}
                            </span>
                            <div className="flex flex-col">
                                <span className={state === "todo" ? "text-gray-400" : "text-gray-900 font-medium"}>
                                    {step.label}
                                    <span className="sr-only">{state === "done" ? " (done)" : state === "active" ? " (in progress)" : ""}</span>
                                </span>
                                {step.detail && state === "active" && <span className="text-sm text-dark-200">{step.detail}</span>}
                            </div>
                        </li>
                    );
                })}
            </ol>

            {!finished && elapsed >= 12 && (
                <p className="text-sm text-dark-200 rounded-2xl bg-[#f7f8ff] px-4 py-3">
                    Taking a little longer? Our free server may be waking up — this can take up to a minute the first time.
                </p>
            )}
        </div>
    );
}
