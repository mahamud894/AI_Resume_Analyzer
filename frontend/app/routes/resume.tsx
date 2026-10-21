import {Link, useParams, useSearchParams} from "react-router";
import {type FormEvent, useEffect, useState} from "react";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import JobFields, {readJobDetails} from "~/components/JobFields";
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

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/dashboard" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Dashboard</span>
                </Link>
            </nav>
            {/* Phone/tablet: feedback first, small preview below. Desktop: side by side with a sticky preview. */}
            <div className="flex flex-col-reverse lg:flex-row w-full">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover items-center justify-center lg:h-screen lg:sticky lg:top-0">
                    <h3 className="lg:hidden self-start text-xl font-bold text-black">Your resume</h3>
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border w-fit max-w-full lg:h-[90%]">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the resume PDF in a new tab" className="block h-full">
                                <img
                                    src={imageUrl}
                                    className="w-auto max-w-full max-h-[360px] sm:max-h-[480px] lg:max-h-none h-auto lg:h-full object-contain rounded-2xl"
                                    alt="Preview of your resume"
                                />
                            </a>
                        </div>
                    )}
                    {resumeUrl && (
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                           className={`primary-button w-full sm:w-fit px-6 ${imageUrl ? 'lg:hidden' : ''}`}>
                            Open PDF
                        </a>
                    )}
                </section>
                <section className="feedback-section">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-3xl sm:text-4xl !text-black font-bold">Resume Review</h2>
                        {analysis && analyses.length === 1 && (
                            <p className="text-gray-500 break-words">
                                {[analysis.companyName, analysis.jobTitle].filter(Boolean).join(' — ')}
                            </p>
                        )}
                    </div>
                    {analysis && analyses.length > 1 && (
                        <div className="form-div">
                            <label htmlFor="analysis-picker">Analyzed for {analyses.length} jobs — showing:</label>
                            <select id="analysis-picker" value={analysis.id} onChange={(e) => showAnalysis(e.target.value)}
                                    className="cursor-pointer">
                                {analyses.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {[a.companyName, a.jobTitle].filter(Boolean).join(' — ')} · {a.feedback.overallScore}/100 · {new Date(a.createdAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {resume && analysis && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link to={`/resume/${resume.id}/improved/${analysis.id}`} className="primary-button sm:w-fit text-lg px-6">
                                {analysis.improved ? 'View Improved Resume' : 'Improve My Resume (Europass)'}
                            </Link>
                            {analysis.improved && (
                                <Link to={`/resume/${resume.id}/improved/${analysis.id}/cover-letter`}
                                      className="secondary-button sm:w-fit text-lg px-6 border-[#0b4ea2] text-[#0b4ea2] font-medium hover:bg-blue-50">
                                    Cover Letter
                                </Link>
                            )}
                        </div>
                    )}
                    {resume && !showJobForm && (
                        <button type="button" onClick={() => setShowJobForm(true)}
                                className="secondary-button sm:w-fit px-6">
                            Analyze for another job
                        </button>
                    )}
                    {resume && showJobForm && (
                        <form onSubmit={handleAnalyzeAgain} className="!gap-4 rounded-2xl bg-gray-50 p-4 sm:p-6">
                            <h3 className="text-xl font-bold text-black">Analyze this resume for another job</h3>
                            <fieldset disabled={isAnalyzing} className="flex flex-col gap-4 w-full">
                                <JobFields />
                            </fieldset>
                            {jobFormError && (
                                <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                                    {jobFormError}
                                </p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <button type="submit" disabled={isAnalyzing} className="primary-button sm:w-fit px-6">
                                    {isAnalyzing ? 'Analyzing... (up to 30 seconds)' : 'Analyze'}
                                </button>
                                <button type="button" disabled={isAnalyzing}
                                        onClick={() => { setShowJobForm(false); setJobFormError(''); }}
                                        className="secondary-button sm:w-fit px-6">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                    {error ? (
                        <p className="rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">{error}</p>
                    ) : feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : resume ? (
                        <p className="text-gray-500">This resume has not been analyzed yet.</p>
                    ) : (
                        <img src="/images/resume-scan-2.gif" alt="Loading" className="w-full max-w-sm mx-auto" />
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume
