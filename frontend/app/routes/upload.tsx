import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {resumeApi} from "~/lib/api";
import {useRequireAuth} from "~/lib/hooks";

export const meta = () => ([
    { title: 'Resumind | Upload' },
    { name: 'description', content: 'Upload your resume for AI feedback' },
])

const Upload = () => {
    useRequireAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);
        let resumeId: string | null = null;

        try {
            // The preview image is only for display — if it fails we still upload the PDF
            setStatusText('Converting to image...');
            const imageFile = await convertPdfToImage(file);
            if (!imageFile.file) console.warn(imageFile.error);

            setStatusText('Uploading the file...');
            const { resume } = await resumeApi.upload(file, imageFile.file);
            resumeId = resume.id;

            setStatusText('Analyzing... (this can take up to 30 seconds)');
            await resumeApi.analyze({ resumeId, companyName, jobTitle, jobDescription });

            setStatusText('Analysis complete, redirecting...');
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
        const formData = new FormData(e.currentTarget);

        const companyName = String(formData.get('company-name') || '').trim();
        const jobTitle = String(formData.get('job-title') || '').trim();
        const jobDescription = String(formData.get('job-description') || '').trim();

        if (!jobTitle) return setError('Please enter the job title.');
        if (jobDescription.length < 20) return setError('Please paste the job description (at least 20 characters).');
        if (!file) return setError('Please upload your resume as a PDF.');

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" maxLength={100} />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" maxLength={100} required />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" maxLength={10000} required />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader file={file} onFileSelect={handleFileSelect} />
                            </div>

                            {error && (
                                <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-left" role="alert">
                                    {error}
                                </p>
                            )}

                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload
