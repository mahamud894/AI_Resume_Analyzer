import {Link, useParams} from "react-router";
import {type FormEvent, useEffect, useRef, useState} from "react";
import CoverLetterSheet from "~/components/CoverLetterSheet";
import {ApiError, resumeApi} from "~/lib/api";
import {countWords, letterToText} from "~/lib/coverLetter";
import {useRequireAuth} from "~/lib/hooks";

export const meta = () => ([
    { title: 'Resumind | Cover Letter' },
    { name: 'description', content: 'A cover letter that matches your improved Europass CV' },
])

const MAX_EDITED_TEXT = 8000; // same limit as the backend
const EMPTY_INPUTS: CoverLetterInputs = { hiringManagerName: '', companyAddress: '', jobSource: '', tone: 'formal' };
const errorMessage = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

const CoverLetterPage = () => {
    const isAuthenticated = useRequireAuth();
    const { id, analysisId } = useParams();
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
    const [inputs, setInputs] = useState<CoverLetterInputs>(EMPTY_INPUTS);
    const [isLoading, setIsLoading] = useState(true);
    const [needsImproved, setNeedsImproved] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const loadedFor = useRef<string | null>(null);

    const showNotice = (text: string) => {
        setNotice(text);
        setTimeout(() => setNotice(''), 2500);
    };

    const applyLetter = (letter: CoverLetter) => {
        setCoverLetter(letter);
        setInputs(letter.inputs);
    };

    // Load: the analysis (job info) → is there an improved resume? → is there a saved letter?
    useEffect(() => {
        if (!isAuthenticated || !id || !analysisId || loadedFor.current === analysisId) return;
        loadedFor.current = analysisId;

        const load = async () => {
            try {
                const { resume } = await resumeApi.get(id);
                const found = resume.analyses.find((a) => a.id === analysisId);
                if (!found) return setError('Analysis not found for this resume.');
                setAnalysis(found);
                if (!found.improved) return setNeedsImproved(true);

                const { coverLetter } = await resumeApi.getCoverLetter(analysisId);
                applyLetter(coverLetter);
            } catch (err) {
                // 404 = no letter yet → just show the form
                if (!(err instanceof ApiError && err.status === 404)) setError(errorMessage(err));
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [isAuthenticated, id, analysisId]);

    const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!analysisId || isGenerating) return;
        if (coverLetter?.editedText && !confirm('Generate a new letter? Your saved edits will be replaced.')) return;

        setIsGenerating(true);
        setIsEditing(false);
        setError('');
        try {
            const { coverLetter } = await resumeApi.generateCoverLetter(analysisId, inputs);
            applyLetter(coverLetter);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsGenerating(false);
        }
    };

    const currentText = coverLetter ? (coverLetter.editedText ?? letterToText(coverLetter.letter)) : '';

    const startEditing = () => {
        setDraft(currentText);
        setIsEditing(true);
        setError('');
    };

    const save = async (text: string, message: string) => {
        if (!analysisId) return;
        setIsSaving(true);
        setError('');
        try {
            const { coverLetter } = await resumeApi.saveCoverLetter(analysisId, text);
            setCoverLetter(coverLetter);
            setIsEditing(false);
            showNotice(message);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentText);
            showNotice('Copied to clipboard');
        } catch {
            setError('Could not copy — please select the text and copy it manually.');
        }
    };

    // Browser print dialog → "Save as PDF". The document title becomes the suggested file name.
    const handleDownload = () => {
        const previousTitle = document.title;
        const name = coverLetter?.letter.signatureName.replace(/\[[^\]]*\]/g, '').trim();
        document.title = `${name || 'My'} - Cover Letter`;
        window.addEventListener('afterprint', () => { document.title = previousTitle; }, { once: true });
        window.print();
    };

    const set = (field: keyof CoverLetterInputs) => (e: { target: { value: string } }) =>
        setInputs((prev) => ({ ...prev, [field]: e.target.value }));

    const letter = coverLetter?.letter;
    const showActions = coverLetter && !isEditing && !isGenerating;

    return (
        <main className="!pt-0 bg-[url('/images/bg-small.svg')] bg-cover bg-center bg-fixed min-h-screen print-area">
            <nav className="resume-nav bg-white no-print">
                <Link to={`/resume/${id}/improved/${analysisId}`} className="back-button">
                    <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Improved Resume</span>
                </Link>
                {/* Tablet/desktop actions; on phones they move to the bottom toolbar */}
                {showActions && (
                    <div className="hidden md:flex flex-row gap-3 flex-wrap justify-end">
                        <button type="button" onClick={startEditing} className="secondary-button">Edit</button>
                        <button type="button" onClick={handleCopy} className="secondary-button">Copy text</button>
                        <button type="button" onClick={handleDownload} className="primary-button w-fit">Download PDF</button>
                    </div>
                )}
            </nav>

            <div className="flex flex-col gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1500px] mx-auto print-area">
                <div className="flex flex-col gap-2 no-print">
                    <h2 className="text-3xl sm:text-4xl !text-black font-bold">Cover Letter</h2>
                    {analysis && (
                        <p className="text-gray-500 break-words">
                            For {[analysis.jobTitle, analysis.companyName].filter(Boolean).join(' at ')} · matches your
                            improved Europass CV
                        </p>
                    )}
                </div>

                {notice && (
                    <p className="no-print toast" role="status">
                        {notice}
                    </p>
                )}

                {error && (
                    <p className="no-print w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                        {error}
                    </p>
                )}

                {isLoading ? (
                    <img src="/images/resume-scan-2.gif" alt="Loading" className="w-[160px] sm:w-[200px] mx-auto no-print" />
                ) : needsImproved ? (
                    <div className="no-print flex flex-col gap-4 items-start">
                        <p className="text-dark-200">The cover letter is written from your improved Europass resume — generate that first.</p>
                        <Link to={`/resume/${id}/improved/${analysisId}`} className="primary-button sm:w-fit px-6">
                            Improve My Resume (Europass)
                        </Link>
                    </div>
                ) : analysis && (
                    <div className={`flex ${coverLetter || isGenerating ? 'flex-col-reverse' : 'flex-col'} xl:flex-row gap-6 sm:gap-8 items-start print-area`}>
                        {/* ---------- Left (desktop) / below the letter (phone, tablet): form + "Why this letter works" ---------- */}
                        <aside className="flex flex-col gap-6 w-full xl:w-[400px] xl:shrink-0 no-print">
                            <form onSubmit={handleGenerate} className="flex flex-col gap-4 bg-white rounded-2xl shadow-md p-4 sm:p-6">
                                <h3 className="text-xl font-bold text-black">Letter details <span className="text-sm font-normal text-gray-500">(all optional)</span></h3>
                                <div className="form-div">
                                    <label htmlFor="hiring-manager">Hiring manager name</label>
                                    <input id="hiring-manager" maxLength={100} placeholder="e.g. Ms. Sarah Rahman"
                                           value={inputs.hiringManagerName} onChange={set('hiringManagerName')} />
                                    <p className="text-xs text-gray-500">Add a title (Mr./Ms./Dr.) to get "Dear Ms. Rahman". Leave empty for "Dear Hiring Manager".</p>
                                </div>
                                <div className="form-div">
                                    <label htmlFor="company-address">Company address</label>
                                    <textarea id="company-address" rows={2} maxLength={300} placeholder="Street, City, Country"
                                              value={inputs.companyAddress} onChange={set('companyAddress')} />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-source">Where did you find the job?</label>
                                    <input id="job-source" maxLength={100} placeholder="e.g. LinkedIn, company website"
                                           value={inputs.jobSource} onChange={set('jobSource')} />
                                </div>
                                <div className="form-div">
                                    <span>Tone</span>
                                    <div className="tone-toggle" role="radiogroup" aria-label="Tone">
                                        {(['formal', 'modern'] as const).map((tone) => (
                                            <button key={tone} type="button" role="radio" aria-checked={inputs.tone === tone}
                                                    className={inputs.tone === tone ? 'active' : ''}
                                                    onClick={() => setInputs((prev) => ({ ...prev, tone }))}>
                                                {tone === 'formal' ? 'Formal' : 'Modern'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="primary-button" disabled={isGenerating}>
                                    {isGenerating ? 'Writing...' : coverLetter ? 'Regenerate' : 'Generate Cover Letter'}
                                </button>
                            </form>

                            {letter && !isGenerating && (
                                <section className="flex flex-col gap-4 bg-white rounded-2xl shadow-md p-4 sm:p-6">
                                    <h3 className="text-xl font-bold text-black">Why this letter works</h3>
                                    <p className="text-sm text-dark-200">
                                        <b>{coverLetter?.editedText ? countWords(coverLetter.editedText) : letter.wordCount}</b>{' '}
                                        {coverLetter?.editedText ? 'words in your edited version (whole letter)' : 'words in the letter body'}
                                        {' '}· target 250–400 for one A4 page
                                    </p>
                                    {letter.highlights.length > 0 ? (
                                        <ul className="flex flex-col gap-3">
                                            {letter.highlights.map((h, i) => (
                                                <li key={i} className="flex flex-col gap-1 rounded-xl bg-gray-50 p-3">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Job asks for: {h.jobRequirement}
                                                    </span>
                                                    <span className="text-gray-800 break-words">{h.resumeEvidence}</span>
                                                    {h.cvSection && <span className="text-xs text-[#0b4ea2]">from your CV · {h.cvSection}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">No highlights were reported.</p>
                                    )}
                                </section>
                            )}
                        </aside>

                        {/* ---------- Right: the letter ---------- */}
                        <section className="flex flex-col gap-3 flex-1 min-w-0 w-full print-area">
                            {isGenerating ? (
                                <div className="no-print flex flex-col items-center gap-4 text-center">
                                    <h2 className="text-xl sm:text-2xl text-dark-200" role="status">Writing your cover letter...</h2>
                                    <img src="/images/resume-scan.gif" alt="" className="w-full max-w-xs sm:max-w-xl lg:max-w-3xl" />
                                </div>
                            ) : isEditing ? (
                                <div className="flex flex-col gap-3 no-print">
                                    <div className="flex flex-row gap-3 justify-between items-center flex-wrap">
                                        <p className="text-sm text-gray-500">
                                            Edit freely — keep a blank line between paragraphs. {draft.length}/{MAX_EDITED_TEXT} characters.
                                        </p>
                                        <div className="hidden md:flex flex-row gap-3">
                                            <button type="button" className="secondary-button" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</button>
                                            <button type="button" className="primary-button w-fit" disabled={isSaving || !draft.trim()}
                                                    onClick={() => save(draft, 'Your edits were saved')}>
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="sheet-frame">
                                        <textarea className="letter-sheet letter-editor" value={draft} maxLength={MAX_EDITED_TEXT}
                                                  onChange={(e) => setDraft(e.target.value)} aria-label="Edit cover letter" />
                                    </div>
                                </div>
                            ) : letter ? (
                                <>
                                    <div className="no-print flex flex-row gap-3 justify-between items-center flex-wrap">
                                        <p className="text-sm text-gray-500">
                                            {coverLetter?.editedText
                                                ? 'Showing your edited version.'
                                                : 'Yellow [placeholders] need your input — click Edit to fill them in.'}
                                        </p>
                                        {coverLetter?.editedText && (
                                            <button type="button" className="text-sm underline text-dark-200 cursor-pointer min-h-11"
                                                    onClick={() => confirm('Discard your edits and show the generated letter again?') && save('', 'Reset to the generated letter')}>
                                                Reset to generated letter
                                            </button>
                                        )}
                                    </div>
                                    <div className="sheet-frame">
                                        <CoverLetterSheet letter={letter} editedText={coverLetter?.editedText} />
                                    </div>
                                </>
                            ) : (
                                <div className="no-print flex flex-col items-center gap-3 text-center bg-white rounded-2xl p-6 sm:p-10">
                                    <h3 className="text-2xl font-semibold text-black">No cover letter yet</h3>
                                    <p className="text-gray-500 max-w-md">
                                        Fill in the optional details <span className="xl:hidden">above</span><span className="hidden xl:inline">on the left</span> and click <b>Generate Cover Letter</b>.
                                        It will be written only from facts in your improved Europass CV.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {/* Phone toolbar, always within thumb reach */}
            {coverLetter && !isGenerating && (
                <div className="mobile-toolbar no-print" role="toolbar" aria-label="Cover letter actions">
                    {isEditing ? (
                        <>
                            <button type="button" className="secondary-button" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</button>
                            <button type="button" className="primary-button" disabled={isSaving || !draft.trim()}
                                    onClick={() => save(draft, 'Your edits were saved')}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" onClick={startEditing} className="secondary-button">Edit</button>
                            <button type="button" onClick={handleCopy} className="secondary-button" aria-label="Copy text">Copy</button>
                            <button type="button" onClick={handleDownload} className="primary-button">Download PDF</button>
                        </>
                    )}
                </div>
            )}
        </main>
    )
}

export default CoverLetterPage
