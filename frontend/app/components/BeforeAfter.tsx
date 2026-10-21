// "Before / After": the score of the original resume next to the score of the improved Europass CV,
// both measured for the same job, with the change per category.
import { useId } from "react";

const CATEGORIES = [
    { key: "ATS", label: "ATS" },
    { key: "toneAndStyle", label: "Tone & Style" },
    { key: "content", label: "Content" },
    { key: "structure", label: "Structure" },
    { key: "skills", label: "Skills" },
] as const;

function Ring({ score, label, muted = false }: { score: number; label: string; muted?: boolean }) {
    const id = useId();
    const r = 40, c = 2 * Math.PI * r;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative size-28 sm:size-32">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                    <defs>
                        <linearGradient id={id} x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={muted ? "#cbd5e1" : "#FF97AD"} />
                            <stop offset="100%" stopColor={muted ? "#94a3b8" : "#5171FF"} />
                        </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r={r} fill="none" stroke="#eef0f4" strokeWidth="9" />
                    <circle cx="50" cy="50" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round"
                            strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
                            className="transition-[stroke-dashoffset] duration-1000" />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${muted ? "text-gray-500" : "text-gray-900"}`}>{score}</span>
                    <span className="text-xs text-gray-400">/100</span>
                </span>
            </div>
            <span className={`text-sm font-semibold uppercase tracking-wider ${muted ? "text-gray-500" : "text-[#606beb]"}`}>{label}</span>
        </div>
    );
}

const deltaClass = (d: number) =>
    d > 0 ? "bg-badge-green text-green-700" : d < 0 ? "bg-badge-red text-red-700" : "bg-gray-100 text-gray-500";
const deltaText = (d: number) => (d > 0 ? `+${d}` : `${d}`);

export default function BeforeAfter({ before, after, scoredAt, editedAfterScore, isScoring, onScore }: {
    before: Feedback;
    after?: Feedback | null;
    scoredAt?: string | null;
    editedAfterScore: boolean;
    isScoring: boolean;
    onScore: () => void;
}) {
    if (!after) {
        return (
            <div className="no-print relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] text-white shadow-sm flex flex-col sm:flex-row sm:items-center gap-5">
                <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-[#FF97AD]/30 blur-3xl" />
                <div className="relative flex-1 flex flex-col gap-1.5">
                    <span className="text-sm font-semibold uppercase tracking-widest text-indigo-200">Before / After</span>
                    <p className="text-xl sm:text-2xl font-semibold">How much did your score improve?</p>
                    <p className="text-indigo-100">
                        Your original resume scored <b className="text-white">{before.overallScore}/100</b> for this job.
                        Score the improved CV for the same job to compare.
                    </p>
                </div>
                <button type="button" onClick={onScore} disabled={isScoring}
                        className="relative btn-shine shrink-0 min-h-12 rounded-full bg-white px-6 font-semibold text-[#312e81] shadow-lg hover:bg-indigo-50 disabled:opacity-70 cursor-pointer">
                    {isScoring ? "Scoring…" : "Score my improved CV"}
                </button>
            </div>
        );
    }

    const diff = after.overallScore - before.overallScore;
    return (
        <section className="no-print bg-white rounded-3xl p-5 sm:p-7 shadow-sm ring-1 ring-black/[0.03] flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold uppercase tracking-widest text-[#606beb]">Before / After</span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {diff > 0 ? `Your score went up by ${diff} points` : diff === 0 ? "Your score stayed the same" : `Your score went down by ${-diff} points`}
                    </h3>
                    <p className="text-sm text-dark-200">
                        Both scored for the same job{scoredAt && ` · ${new Date(scoredAt).toLocaleString()}`}
                    </p>
                </div>
                <button type="button" onClick={onScore} disabled={isScoring} className="secondary-button text-sm">
                    {isScoring ? "Scoring…" : "Score again"}
                </button>
            </div>

            {editedAfterScore && (
                <p className="rounded-2xl bg-badge-yellow text-badge-yellow-text px-4 py-3 text-sm">
                    You edited the CV after this score — click <b>Score again</b> to include your changes.
                </p>
            )}

            <div className="flex items-center justify-center gap-4 sm:gap-10">
                <Ring score={before.overallScore} label="Before" muted />
                <div className="flex flex-col items-center gap-1">
                    <svg className="size-8 text-[#8e98ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5l5 5-5 5" />
                    </svg>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${deltaClass(diff)}`}>{deltaText(diff)}</span>
                </div>
                <Ring score={after.overallScore} label="After" />
            </div>

            <table className="w-full text-sm">
                <caption className="sr-only">Score per category before and after</caption>
                <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                        <th className="py-2 font-semibold">Category</th>
                        <th className="py-2 font-semibold text-right">Before</th>
                        <th className="py-2 font-semibold text-right">After</th>
                        <th className="py-2 font-semibold text-right">Change</th>
                    </tr>
                </thead>
                <tbody>
                    {CATEGORIES.map(({ key, label }) => {
                        const b = before[key].score, a = after[key].score, d = a - b;
                        return (
                            <tr key={key} className="border-t border-gray-100">
                                <th scope="row" className="py-2.5 text-left font-medium text-gray-800">{label}</th>
                                <td className="py-2.5 text-right text-gray-500">{b}</td>
                                <td className="py-2.5 text-right font-semibold text-gray-900">{a}</td>
                                <td className="py-2.5 text-right">
                                    <span className={`inline-block min-w-11 rounded-full px-2 py-0.5 text-center text-xs font-bold ${deltaClass(d)}`}>{deltaText(d)}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="text-xs text-gray-400">
                Placeholders such as [Add your phone] are not counted. Fill them in, save, and score again for the best result.
            </p>
        </section>
    );
}
