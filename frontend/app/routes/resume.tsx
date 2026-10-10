import {Link, useParams} from "react-router";
import {useEffect, useState} from "react";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import {resumeApi} from "~/lib/api";
import {useProtectedFile, useRequireAuth} from "~/lib/hooks";

export const meta = () => ([
    { title: 'Resumind | Review ' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const isAuthenticated = useRequireAuth();
    const { id } = useParams();
    const [resume, setResume] = useState<Resume | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated || !id) return;

        resumeApi.get(id)
            .then(({ resume }) => setResume(resume))
            .catch((err) => setError(err.message));
    }, [isAuthenticated, id]);

    // PDF and preview image are protected by the JWT, so we download them as blobs
    const resumeUrl = useProtectedFile(resume?.fileUrl);
    const imageUrl = useProtectedFile(resume?.imageUrl);
    const analysis = resume?.analyses[0];
    const feedback = analysis?.feedback;

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                    {!imageUrl && resumeUrl && (
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="primary-button w-fit">
                            Open {resume?.originalName}
                        </a>
                    )}
                </section>
                <section className="feedback-section">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {analysis && (
                        <p className="text-gray-500 -mt-6">
                            {[analysis.companyName, analysis.jobTitle].filter(Boolean).join(' — ')}
                        </p>
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
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume
