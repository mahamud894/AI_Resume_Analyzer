// Score history of one resume: every analysis (oldest → newest) with its overall score, and — where
// the improved Europass CV was scored — the "after" score for the same job.
// Two series → legend + direct labels on the last points; hover/focus a point for details;
// a table view for screen readers and anyone who prefers numbers.
import { useEffect, useRef, useState } from "react";

const ORIGINAL = "#606beb";
const IMPROVED = "#e0457b";
const H = 240;
const PAD = { top: 20, right: 28, bottom: 44, left: 40 };

type Point = { x: number; y: number; score: number; series: "original" | "improved"; analysis: Analysis };

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const jobLabel = (a: Analysis) => [a.jobTitle, a.companyName].filter(Boolean).join(" · ");

export default function ScoreHistoryChart({ analyses, selectedId, onSelect }: {
    analyses: Analysis[];
    selectedId?: string;
    onSelect?: (analysisId: string) => void;
}) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [hover, setHover] = useState<Point | null>(null);

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const ordered = [...analyses].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    const hasAfter = ordered.some((a) => a.improved?.afterFeedback);
    const plotW = width - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const xAt = (i: number) => PAD.left + (ordered.length === 1 ? plotW / 2 : (plotW * i) / (ordered.length - 1));
    const yAt = (score: number) => PAD.top + plotH * (1 - score / 100);

    const original: Point[] = ordered.map((a, i) => ({ x: xAt(i), y: yAt(a.feedback.overallScore), score: a.feedback.overallScore, series: "original", analysis: a }));
    const improved: Point[] = ordered.flatMap((a, i) => a.improved?.afterFeedback
        ? [{ x: xAt(i), y: yAt(a.improved.afterFeedback.overallScore), score: a.improved.afterFeedback.overallScore, series: "improved" as const, analysis: a }]
        : []);
    const path = (pts: Point[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
    const lastOriginal = original.at(-1);
    const lastImproved = improved.at(-1);
    // Show at most ~6 x labels so they never collide
    const labelEvery = Math.max(1, Math.ceil(ordered.length / Math.max(1, Math.floor(plotW / 90))));

    if (ordered.length < 2 && !hasAfter) {
        return (
            <p className="text-sm text-dark-200 rounded-2xl bg-[#f7f8ff] px-4 py-3">
                Your score history appears here once you analyze this resume for another job, or score your improved Europass CV.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-dark-200" aria-label="Legend">
                <li className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: ORIGINAL }} />Original resume</li>
                {hasAfter && <li className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: IMPROVED }} />Improved Europass CV</li>}
            </ul>

            <div ref={boxRef} className="relative w-full" onMouseLeave={() => setHover(null)}>
                <svg width={width} height={H} role="img" aria-label={`Overall score for ${ordered.length} analyses of this resume`} className="block overflow-visible">
                    {[0, 25, 50, 75, 100].map((t) => (
                        <g key={t}>
                            <line x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)} stroke="#eef0f4" strokeWidth={1} />
                            <text x={PAD.left - 10} y={yAt(t)} textAnchor="end" dominantBaseline="middle" className="fill-gray-400 text-[11px]">{t}</text>
                        </g>
                    ))}
                    {ordered.map((a, i) => i % labelEvery === 0 || i === ordered.length - 1 ? (
                        <text key={a.id} x={xAt(i)} y={H - PAD.bottom + 22} textAnchor="middle" className="fill-gray-500 text-[11px]">{shortDate(a.createdAt)}</text>
                    ) : null)}

                    {/* A thin connector shows how much one job's score rose after the rewrite */}
                    {improved.map((p) => {
                        const o = original.find((q) => q.analysis.id === p.analysis.id)!;
                        return <line key={`c-${p.analysis.id}`} x1={o.x} x2={p.x} y1={o.y} y2={p.y} stroke={IMPROVED} strokeOpacity={0.35} strokeWidth={2} />;
                    })}
                    {original.length > 1 && <path d={path(original)} fill="none" stroke={ORIGINAL} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                    {improved.length > 1 && <path d={path(improved)} fill="none" stroke={IMPROVED} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

                    {[...original, ...improved].map((p) => {
                        const selected = p.analysis.id === selectedId && p.series === "original";
                        return (
                            <g key={`${p.series}-${p.analysis.id}`}>
                                <circle cx={p.x} cy={p.y} r={selected ? 7 : 5} fill={p.series === "original" ? ORIGINAL : IMPROVED} stroke="white" strokeWidth={2} />
                                {/* Bigger invisible hit target for mouse, touch and keyboard */}
                                <circle cx={p.x} cy={p.y} r={14} fill="transparent" className="cursor-pointer outline-none"
                                        tabIndex={0} role="button"
                                        aria-label={`${p.series === "original" ? "Original" : "Improved CV"} ${p.score}/100 for ${jobLabel(p.analysis)}, ${shortDate(p.analysis.createdAt)}`}
                                        onMouseEnter={() => setHover(p)} onFocus={() => setHover(p)} onBlur={() => setHover(null)}
                                        onClick={() => onSelect?.(p.analysis.id)}
                                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.(p.analysis.id)} />
                            </g>
                        );
                    })}

                    {/* Direct labels on the latest points only */}
                    {lastOriginal && (
                        <text x={lastOriginal.x + 10} y={lastOriginal.y + (lastImproved && Math.abs(lastImproved.y - lastOriginal.y) < 16 ? 12 : 0)}
                              dominantBaseline="middle" className="fill-gray-700 text-[12px] font-semibold">{lastOriginal.score}</text>
                    )}
                    {lastImproved && (
                        <text x={lastImproved.x + 10} y={lastImproved.y - (Math.abs(lastImproved.y - (lastOriginal?.y ?? 0)) < 16 ? 4 : 0)}
                              dominantBaseline="middle" className="fill-gray-700 text-[12px] font-semibold">{lastImproved.score}</text>
                    )}
                </svg>

                {hover && (
                    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
                         style={{ left: Math.min(Math.max(hover.x, 90), width - 90), top: hover.y - 12 }}>
                        <p className="font-semibold">{hover.score}/100 · {hover.series === "original" ? "Original" : "Improved CV"}</p>
                        <p className="text-gray-300 max-w-48 truncate">{jobLabel(hover.analysis)}</p>
                        <p className="text-gray-400">{new Date(hover.analysis.createdAt).toLocaleDateString()}</p>
                    </div>
                )}
            </div>

            <details className="text-sm">
                <summary className="cursor-pointer text-dark-200 min-h-11 flex items-center">Show as table</summary>
                <table className="w-full mt-2">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                            <th className="py-1.5 font-semibold">Date</th>
                            <th className="py-1.5 font-semibold">Job</th>
                            <th className="py-1.5 font-semibold text-right">Original</th>
                            <th className="py-1.5 font-semibold text-right">Improved</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordered.map((a) => (
                            <tr key={a.id} className="border-t border-gray-100">
                                <td className="py-1.5 text-gray-500 whitespace-nowrap">{shortDate(a.createdAt)}</td>
                                <td className="py-1.5 text-gray-800 break-words">{jobLabel(a)}</td>
                                <td className="py-1.5 text-right font-semibold">{a.feedback.overallScore}</td>
                                <td className="py-1.5 text-right font-semibold">{a.improved?.afterFeedback?.overallScore ?? "–"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </div>
    );
}
