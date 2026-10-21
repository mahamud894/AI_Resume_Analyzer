import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import JobFields, {type JobDetails, readJobDetails} from "~/components/JobFields";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {resumeApi} from "~/lib/api";
import {useRequireAuth} from "~/lib/hooks";
import {Card} from "~/components/PageChrome";
import ProgressSteps from "~/components/ProgressSteps";

export const meta = () => ([
    { title: 'Resumind | Upload' },
    { name: 'description', content: 'Upload your resume for AI feedback' },
])

const Upload = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    // Index of the running step in ANALYSIS_STEPS (shown instead of the form while processing)
    const [phase, setPhase] = useState(0);
    const [error, setError] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async (job: JobDetails, file: File) => {
        setIsProcessing(true);
        let resumeId: string | null = null;

        try {
            // The preview image is only for display — if it fails we still upload the PDF
            setPhase(0);
            const imageFile = await convertPdfToImage(file);
            if (!imageFile.file) console.warn(imageFile.error);

            setPhase(1);
            const { resume } = await resumeApi.upload(file, imageFile.file);
            resumeId = resume.id;

            setPhase(2);
            await resumeApi.analyze({ resumeId, ...job });

            setPhase(3);
            navigate(`/resume/${resumeId}`);
        } catch (err) {
            // Don't keep a half-finished upload in the user's history
            if (resumeId) await resumeApi.remove(resumeId).catch(() => {});
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setIsProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        const { job, error } = readJobDetails(e.currentTarget);
        if (error) return setError(error);
        if (!file) return setError('Please upload your resume as a PDF.');

        handleAnalyze(job!, file);
    }

    return (
        <main className="page-bg-long">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-4 sm:py-10">
                    <span className="text-sm font-semibold uppercase tracking-widest text-[#606beb]">New analysis</span>
                    <h1 className="text-balance">Smart feedback for your dream job</h1>
                    <h2>{isProcessing
                        ? 'Hang tight — your report is on its way'
                        : 'Add the job, drop your resume, and get an ATS score with clear tips'}</h2>
                </div>

                {isProcessing ? (
                    <ProgressSteps title="Analyzing your resume" current={phase} steps={ANALYSIS_STEPS} />
                ) : (
                    <form id="upload-form" onSubmit={handleSubmit}
                          className="!grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] !gap-6 w-full max-w-6xl !items-start text-left">
                        <Card className="flex flex-col gap-5">
                            <StepHeading number={1} title="The job" text="The AI compares your resume with this job." />
                            <JobFields />
                        </Card>

                        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
                            <Card className="flex flex-col gap-5">
                                <StepHeading number={2} title="Your resume" text="A text-based PDF works best." />
                                <div className="form-div">
                                    <label htmlFor="uploader" className="sr-only">Upload Resume</label>
                                    <FileUploader file={file} onFileSelect={handleFileSelect} />
                                </div>

                                {error && (
                                    <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-left" role="alert">
                                        {error}
                                    </p>
                                )}

                                <button className="primary-button btn-shine text-lg font-semibold !min-h-12" type="submit">
                                    Analyze Resume
                                </button>
                            </Card>

                            <Card className="flex flex-col gap-3 !bg-[#f7f8ff]">
                                <p className="font-semibold text-gray-900">What you will get</p>
                                <ul className="flex flex-col gap-2 text-sm text-dark-200">
                                    {['Overall and ATS score out of 100', 'Tips for tone, content, structure and skills',
                                      'A Europass CV and cover letter in one click', 'A PDF report you can download'].map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <span className="mt-0.5 size-5 shrink-0 rounded-full bg-badge-green text-green-700 text-xs flex items-center justify-center">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    </form>
                )}
            </section>
        </main>
    )
}

const ANALYSIS_STEPS = [
    { label: 'Reading your PDF', detail: 'Making a preview of the first page' },
    { label: 'Uploading securely', detail: 'Only you can open your files' },
    { label: 'AI is analyzing', detail: 'ATS, tone & style, content, structure and skills · usually 15–30 seconds' },
    { label: 'Done — opening your report' },
];

function StepHeading({ number, title, text }: { number: number; title: string; text: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="primary-gradient size-10 shrink-0 rounded-xl flex items-center justify-center text-white font-semibold">{number}</span>
            <div>
                <p className="text-lg font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-dark-200">{text}</p>
            </div>
        </div>
    );
}

export default Upload
