import {Link, useParams, useSearchParams} from "react-router";
import {type FormEvent, useEffect, useState} from "react";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import JobFields, {readJobDetails} from "~/components/JobFields";
import {Card, PageTitle, TopBar} from "~/components/PageChrome";
import ProgressSteps from "~/components/ProgressSteps";
import ReportPrint from "~/components/ReportPrint";
import ScoreHistoryChart from "~/components/ScoreHistoryChart";
import {resumeApi} from "~/lib/api";
import {useProtectedFile, useRequireAuth} from "~/lib/hooks";

export const meta = () => ([
    { title: 'Resumind | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const isAuthenticated = useRequireAuth();
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [resume, setResume] = useState<Resume | null>(null);
    const [error, setError] = useState('');
    const [showJobForm, setShowJobForm] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [jobFormError, setJobFormError] = useState('');

    useEffect(() => {
        if (!isAuthenticated || !id) return;

        resumeApi.get(id)
            .then(({ resume }) => setResume(resume))
            .catch((err) => setError(err.message));
    }, [isAuthenticated, id]);

    // PDF and preview image are protected by the JWT, so we download them as blobs
    const resumeUrl = useProtectedFile(resume?.fileUrl);
    const imageUrl = useProtectedFile(resume?.imageUrl);
    // ?analysis=<id> picks one of the jobs this resume was analyzed for; default is the newest
    const analyses = resume?.analyses ?? [];
    const analysis = analyses.find((a) => a.id === searchParams.get('analysis')) ?? analyses[0];
    const feedback = analysis?.feedback;

    const showAnalysis = (analysisId: string) => setSearchParams({ analysis: analysisId }, { replace: true });

    // Same resume, new job: runs a new analysis and switches to it
    const handleAnalyzeAgain = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setJobFormError('');
        const { job, error } = readJobDetails(e.currentTarget);
        if (error) return setJobFormError(error);
        if (!resume) return;

        setIsAnalyzing(true);
        try {
            const { analysis: created } = await resumeApi.analyze({ resumeId: resume.id, ...job! });
            // Add it locally (newest first) instead of re-fetching: a failed re-fetch would show an
            // error for an analysis that did succeed and invite a duplicate (quota-using) retry
            setResume((current) => current && { ...current, analyses: [created, ...current.analyses] });
            showAnalysis(created.id);
            setShowJobForm(false);
        } catch (err) {
            setJobFormError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsAnalyzing(false);
        }
    }

    // Browser print dialog → "Save as PDF" (only the report below is printed)
    const handleDownloadReport = () => {
        if (!analysis) return;
        const previousTitle = document.title;
        document.title = `Resume report - ${analysis.jobTitle}`;
        window.addEventListener('afterprint', () => { document.title = previousTitle; }, { once: true });
        window.print();
    };

    const improvedUrl = resume && analysis ? `/resume/${resume.id}/improved/${analysis.id}` : '';

    return (
        <main className="page-bg-long !pt-4">
            <TopBar back={{ to: '/dashboard', label: 'Dashboard' }}>
                {analysis && (
                    <>
                        <button type="button" onClick={handleDownloadReport} className="secondary-button">Download Report</button>
                        <Link to={improvedUrl} className="primary-button btn-shine w-fit px-5">
                            {analysis.improved ? 'View Improved CV' : 'Improve My CV'}
                        </Link>
                    </>
                )}
            </TopBar>

            <div className="no-print w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
                <PageTitle
                    eyebrow="Resume review"
                    title={analysis ? analysis.jobTitle : 'Resume Review'}
                    subtitle={analysis && (
                        <>
                            {analysis.companyName && <>{analysis.companyName} · </>}
                            {resume?.originalName} · analyzed {new Date(analysis.createdAt).toLocaleDateString()}
                        </>
                    )}
                >
                    {analysis && analyses.length > 1 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 max-w-2xl">
                            <label htmlFor="analysis-picker" className="text-sm shrink-0">Analyzed for {analyses.length} jobs:</label>
                            <select id="analysis-picker" value={analysis.id} onChange={(e) => showAnalysis(e.target.value)}
                                    className="cursor-pointer !py-2.5 !rounded-full !shadow-none ring-1 ring-gray-200">
                                {analyses.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {[a.companyName, a.jobTitle].filter(Boolean).join(' — ')} · {a.feedback.overallScore}/100 · {new Date(a.createdAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </PageTitle>

                {error && (
                    <p className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">{error}</p>
                )}

                {!resume && !error ? (
                    <div className="flex justify-center py-10">
                        <span className="size-10 rounded-full border-4 border-[#e6e9ff] border-t-[#606beb] animate-spin" aria-label="Loading" />
                    </div>
                ) : resume && (
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 sm:gap-8 items-start">
                        {/* Resume preview: below the feedback on phones, sticky on the left on desktop */}
                        <aside className="order-2 lg:order-1 lg:sticky lg:top-28 flex flex-col gap-4">
                            <div className="gradient-border shadow-sm">
                                {imageUrl ? (
                                    <a href={resumeUrl || undefined} target="_blank" rel="noopener noreferrer" aria-label="Open the resume PDF in a new tab" className="block">
                                        <img src={imageUrl} alt="Preview of your resume"
                                             className="w-full max-h-[480px] lg:max-h-[calc(100vh-14rem)] object-contain object-top rounded-2xl bg-white animate-in fade-in duration-700" />
                                    </a>
                                ) : (
                                    <div className="h-64 rounded-2xl bg-white flex flex-col items-center justify-center gap-3 text-dark-200">
                                        <img src="/images/pdf.png" alt="" className="size-14 object-contain" />
                                        <span className="text-sm break-all px-4 text-center">{resume.originalName}</span>
                                    </div>
                                )}
                            </div>
                            {resumeUrl && (
                                <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="secondary-button w-full">Open original PDF</a>
                            )}
                        </aside>

                        <div className="order-1 lg:order-2 flex flex-col gap-6 min-w-0">
                            {/* Next steps */}
                            {analysis && (
                                <Card className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="!text-xl sm:!text-2xl font-semibold !text-gray-900">Next steps</h2>
                                        <p className="text-sm text-dark-200">Rewrite your resume in Europass format, write a matching cover letter, or save this report.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                        <Link to={improvedUrl} className="primary-button btn-shine sm:w-fit px-6">
                                            {analysis.improved ? 'View Improved CV' : 'Improve My CV (Europass)'}
                                        </Link>
                                        {analysis.improved && (
                                            <Link to={`${improvedUrl}/cover-letter`}
                                                  className="secondary-button sm:w-fit px-6 border-[#0b4ea2] text-[#0b4ea2] font-medium hover:bg-blue-50">
                                                Cover Letter
                                            </Link>
                                        )}
                                        <button type="button" onClick={handleDownloadReport} className="secondary-button sm:w-fit px-6">
                                            Download Report (PDF)
                                        </button>
                                        {!showJobForm && (
                                            <button type="button" onClick={() => setShowJobForm(true)} className="secondary-button sm:w-fit px-6">
                                                Analyze for another job
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {showJobForm && (isAnalyzing ? (
                                <ProgressSteps title="Analyzing for the new job" steps={[
                                    { label: 'Reading your resume', after: 0 },
                                    { label: 'AI is checking ATS, tone, content, structure and skills', detail: 'Usually 15–30 seconds', after: 3 },
                                    { label: 'Saving your report', after: 28 },
                                    { label: 'Done' },
                                ]} />
                            ) : (
                                <Card>
                                    <form onSubmit={handleAnalyzeAgain} className="!gap-4">
                                        <h2 className="!text-xl sm:!text-2xl font-semibold !text-gray-900">Analyze this resume for another job</h2>
                                        <JobFields />
                                        {jobFormError && (
                                            <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                                                {jobFormError}
                                            </p>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                                            <button type="submit" className="primary-button btn-shine sm:w-fit px-6">Analyze</button>
                                            <button type="button" onClick={() => { setShowJobForm(false); setJobFormError(''); }}
                                                    className="secondary-button sm:w-fit px-6">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </Card>
                            ))}

                            {analyses.length > 0 && (
                                <Card className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="!text-xl sm:!text-2xl font-semibold !text-gray-900">Score history</h2>
                                        <p className="text-sm text-dark-200">Every analysis of this resume, and the score of your improved CV for the same job.</p>
                                    </div>
                                    <ScoreHistoryChart analyses={analyses} selectedId={analysis?.id} onSelect={showAnalysis} />
                                </Card>
                            )}

                            {feedback ? (
                                <div className="flex flex-col gap-6 animate-in fade-in duration-700">
                                    <Summary feedback={feedback} />
                                    <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                                    <Details feedback={feedback} />
                                </div>
                            ) : (
                                <p className="text-gray-500">This resume has not been analyzed yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {resume && analysis && <ReportPrint resume={resume} analysis={analysis} />}
        </main>
    )
}
export default Resume
