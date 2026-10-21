import {Link, useParams} from "react-router";
import {useCallback, useEffect, useRef, useState} from "react";
import EuropassCv from "~/components/EuropassCv";
import ImprovementReport from "~/components/ImprovementReport";
import BeforeAfter from "~/components/BeforeAfter";
import {PageTitle, TopBar} from "~/components/PageChrome";
import ProgressSteps from "~/components/ProgressSteps";
import {ApiError, resumeApi} from "~/lib/api";
import {collectCvEdits, currentCv} from "~/lib/europass";
import {useRequireAuth} from "~/lib/hooks";

export const meta = () => ([
    { title: 'Resumind | Improved Resume' },
    { name: 'description', content: 'Your resume improved and restructured in Europass format' },
])

const errorMessage = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

const Improved = () => {
    const isAuthenticated = useRequireAuth();
    const { id, analysisId } = useParams();
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [improved, setImproved] = useState<ImprovedResume | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    // Guards against starting two generations at once (e.g. React StrictMode runs effects twice in dev)
    const generatingRef = useRef(false);
    const loadedFor = useRef<string | null>(null);

    const generate = useCallback(async () => {
        if (!analysisId || generatingRef.current) return;
        generatingRef.current = true;
        setIsGenerating(true);
        setError('');
        try {
            const { improved } = await resumeApi.improve(analysisId);
            setImproved(improved);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            generatingRef.current = false;
            setIsGenerating(false);
        }
    }, [analysisId]);

    // Load the analysis (for the job title) and the saved improved resume.
    // If there is none yet, generate it straight away.
    useEffect(() => {
        if (!isAuthenticated || !id || !analysisId || loadedFor.current === analysisId) return;
        loadedFor.current = analysisId;

        const load = async () => {
            try {
                const { resume } = await resumeApi.get(id);
                const found = resume.analyses.find((a) => a.id === analysisId);
                if (!found) return setError('Analysis not found for this resume.');
                setAnalysis(found);

                if (!found.improved) return generate();
                const { improved } = await resumeApi.getImproved(analysisId);
                setImproved(improved);
            } catch (err) {
                if (err instanceof ApiError && err.status === 404) return generate();
                setError(errorMessage(err));
            }
        };
        load();
    }, [isAuthenticated, id, analysisId]);

    const coverLetterUrl = `/resume/${id}/improved/${analysisId}/cover-letter`;

    const handleRegenerate = () => {
        const warning = improved?.editedCv || isDirty
            ? 'Generate a new improved version? The current one AND your edits will be replaced.'
            : 'Generate a new improved version? The current one will be replaced.';
        if (confirm(warning)) {
            setIsDirty(false);
            generate();
        }
    };

    // Browser print dialog → "Save as PDF". The document title becomes the suggested file name.
    const handleDownload = () => {
        const previousTitle = document.title;
        const name = improved && currentCv(improved).personalInfo.fullName.replace(/\[[^\]]*\]/g, '').trim();
        document.title = `${name || 'My'} - Europass CV`;
        window.addEventListener('afterprint', () => { document.title = previousTitle; }, { once: true });
        window.print();
    };

    // ---------- Before / After score ----------
    const [isScoring, setIsScoring] = useState(false);
    const handleScore = async () => {
        if (!analysisId || isScoring) return;
        if (isDirty && !confirm('You have unsaved edits. Score the last saved version?')) return;
        setIsScoring(true);
        setError('');
        try {
            const { improved } = await resumeApi.scoreImproved(analysisId);
            setImproved(improved);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsScoring(false);
        }
    };
    const editedAfterScore = Boolean(improved?.scoredAt && improved.editedAt && improved.editedAt > improved.scoredAt);

    // ---------- Inline edits ----------
    const cvRef = useRef<HTMLDivElement>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const [cvVersion, setCvVersion] = useState(0); // bumping it re-renders the CV from saved data
    const [placeholderCount, setPlaceholderCount] = useState(0);

    const countPlaceholders = () =>
        setPlaceholderCount(cvRef.current?.querySelectorAll('mark.europass-placeholder').length ?? 0);
    useEffect(countPlaceholders, [improved, isGenerating, cvVersion]);

    // Stable callback, so the memoised CV is not re-rendered while typing
    const handleEdit = useCallback(() => {
        setIsDirty(true);
        countPlaceholders();
    }, []);

    // Warn before leaving the page with unsaved edits
    useEffect(() => {
        if (!isDirty) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const saveCv = async (cv: EuropassCv | null, message: string) => {
        if (!analysisId) return;
        setIsSaving(true);
        setError('');
        try {
            const { improved } = await resumeApi.saveImproved(analysisId, cv);
            setImproved(improved);
            setIsDirty(false);
            setCvVersion((v) => v + 1);
            setNotice(message);
            setTimeout(() => setNotice(''), 2500);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        if (!improved || !cvRef.current) return;
        saveCv(collectCvEdits(cvRef.current, currentCv(improved)), 'Your changes were saved');
    };

    const handleDiscard = () => {
        setIsDirty(false);
        setCvVersion((v) => v + 1); // re-render the last saved version
    };

    const handleResetToAi = () => {
        if (confirm('Discard all your edits and show the AI version again?')) saveCv(null, 'Reset to the AI version');
    };

    return (
        <main className="page-bg-long !pt-4 print-area">
            <TopBar back={{ to: `/resume/${id}?analysis=${analysisId}`, label: 'Review' }}>
                {/* Tablet/desktop actions; on phones they move to the bottom toolbar */}
                {improved && !isGenerating && (
                    <>
                        <Link to={coverLetterUrl}
                              className="secondary-button border-[#0b4ea2] text-[#0b4ea2] font-medium hover:bg-blue-50">
                            {improved.coverLetter ? 'View Cover Letter' : 'Generate Cover Letter'}
                        </Link>
                        <button type="button" onClick={handleRegenerate} className="secondary-button">
                            Regenerate
                        </button>
                        <button type="button" onClick={handleDownload} className="primary-button btn-shine w-fit">
                            Download PDF
                        </button>
                    </>
                )}
            </TopBar>

            <div className="flex flex-col gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1500px] mx-auto print-area">
                <PageTitle
                    eyebrow="Improved resume"
                    title="Improved Resume"
                    subtitle={analysis && (
                        <>
                            Tailored for {[analysis.jobTitle, analysis.companyName].filter(Boolean).join(' at ')}
                            {improved && ` · generated ${new Date(improved.createdAt).toLocaleString()}`}
                        </>
                    )}
                >
                    {improved && !isGenerating && (
                        <Link to={coverLetterUrl}
                              className="md:hidden mt-2 secondary-button w-full border-[#0b4ea2] text-[#0b4ea2] font-medium hover:bg-blue-50">
                            {improved.coverLetter ? 'View Cover Letter' : 'Generate Cover Letter'}
                        </Link>
                    )}
                </PageTitle>

                {notice && (
                    <p className="no-print toast" role="status">
                        {notice}
                    </p>
                )}

                {error && (
                    <div className="no-print flex flex-col gap-3 items-start">
                        <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                            {error}
                        </p>
                        {analysis && !isGenerating && (
                            <button type="button" className="primary-button w-fit" onClick={generate}>Try again</button>
                        )}
                    </div>
                )}

                {isGenerating ? (
                    <ProgressSteps title="Rewriting your resume in Europass format" steps={[
                        { label: 'Reading your resume and feedback', after: 0 },
                        { label: 'Rewriting every section in Europass format', detail: 'Usually 30–60 seconds', after: 4 },
                        { label: 'Checking facts, dates and placeholders', after: 40 },
                        { label: 'Done' },
                    ]} />
                ) : improved ? (
                    <div className="flex flex-row max-xl:flex-col gap-8 items-start print-area">
                        <div className="flex flex-col gap-6 w-[40%] max-xl:w-full no-print">
                        {analysis && (isScoring && !improved.afterFeedback ? (
                            <ProgressSteps title="Scoring your improved CV" steps={[
                                { label: 'Reading your improved CV', after: 0 },
                                { label: 'Scoring it for the same job', detail: 'Usually 15–30 seconds', after: 3 },
                                { label: 'Done' },
                            ]} />
                        ) : (
                            <BeforeAfter before={analysis.feedback} after={improved.afterFeedback} scoredAt={improved.scoredAt}
                                         editedAfterScore={editedAfterScore} isScoring={isScoring} onScore={handleScore} />
                        ))}
                        <section className="flex flex-col gap-4 bg-white rounded-3xl p-5 sm:p-7 shadow-sm ring-1 ring-black/[0.03]">
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">What we improved</h3>
                            <p className="text-gray-500">
                                Every change below is based on your analysis feedback and the job description.
                                Nothing was invented — anything we could not find in your resume is marked as a
                                <mark className="europass-placeholder mx-1">[placeholder]</mark>for you to fill in.
                            </p>
                            <ImprovementReport changes={improved.changes} />
                        </section>
                        </div>

                        <section className="flex flex-col gap-3 flex-1 min-w-0 w-full print-area">
                            <div className="no-print flex flex-row gap-3 justify-between items-end flex-wrap">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                        Your Europass CV
                                        {improved.editedCv && <span className="ml-2 align-middle text-xs font-medium rounded-full px-2 py-0.5 bg-badge-green text-badge-green-text">edited by you</span>}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {placeholderCount > 0 && <><b>{placeholderCount}</b> yellow placeholder(s) need your input. </>}
                                        Click any text in the CV to edit it, then save.
                                    </p>
                                </div>
                                <div className="hidden md:flex flex-row gap-3">
                                    {isDirty ? (
                                        <>
                                            <button type="button" className="secondary-button" onClick={handleDiscard} disabled={isSaving}>Discard</button>
                                            <button type="button" className="primary-button w-fit" onClick={handleSave} disabled={isSaving}>
                                                {isSaving ? 'Saving...' : 'Save changes'}
                                            </button>
                                        </>
                                    ) : improved.editedCv && (
                                        <button type="button" className="secondary-button" onClick={handleResetToAi} disabled={isSaving}>
                                            Reset to AI version
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div ref={cvRef} className="print-area sheet-frame">
                                {/* key: a regenerated / saved / reset CV is rendered fresh (drops unsaved DOM edits) */}
                                <EuropassCv
                                    key={`${improved.id}-${improved.createdAt}-${cvVersion}`}
                                    cv={currentCv(improved)}
                                    onEdit={handleEdit}
                                />
                            </div>
                        </section>
                    </div>
                ) : !error && (
                    <div className="no-print flex justify-center py-10">
                        <span className="size-10 rounded-full border-4 border-[#e6e9ff] border-t-[#606beb] animate-spin" aria-label="Loading" />
                    </div>
                )}
            </div>

            {/* Phone toolbar, always within thumb reach */}
            {improved && !isGenerating && (
                <div className="mobile-toolbar no-print" role="toolbar" aria-label="CV actions">
                    {isDirty ? (
                        <>
                            <button type="button" className="secondary-button" onClick={handleDiscard} disabled={isSaving}>Discard</button>
                            <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="secondary-button" onClick={handleRegenerate}>Regenerate</button>
                            {improved.editedCv && (
                                <button type="button" className="secondary-button" onClick={handleResetToAi} disabled={isSaving}
                                        aria-label="Reset to AI version">
                                    Reset to AI
                                </button>
                            )}
                            <button type="button" className="primary-button" onClick={handleDownload}>Download PDF</button>
                        </>
                    )}
                </div>
            )}
        </main>
    )
}

export default Improved
