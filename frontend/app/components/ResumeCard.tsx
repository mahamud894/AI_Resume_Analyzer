import {useState} from "react";
import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {resumeApi} from "~/lib/api";
import {useProtectedFile} from "~/lib/hooks";

type Props = {
    resume: Resume;
    // Called after the resume was deleted on the server, so the list can drop it
    onDeleted: (id: string) => void;
};

const ResumeCard = ({ resume: { id, imageUrl, analyses, originalName }, onDeleted }: Props) => {
    const imageSrc = useProtectedFile(imageUrl);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    // Each card shows the most recent analysis of this resume
    const latest = analyses[0];
    const companyName = latest?.companyName;
    const jobTitle = latest?.jobTitle;

    const handleDelete = async () => {
        const name = companyName || jobTitle || originalName;
        if (!confirm(`Delete "${name}" with its analysis, improved resume and cover letter? This cannot be undone.`)) return;
        setIsDeleting(true);
        setError('');
        try {
            await resumeApi.remove(id);
            onDeleted(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not delete the resume');
            setIsDeleting(false);
        }
    }

    // The delete button sits outside the <Link>, because a button inside a link is invalid HTML
    return (
        <div className={`resume-card animate-in fade-in duration-1000 ${isDeleting ? 'opacity-50' : ''}`}>
            <Link to={`/resume/${id}`} className="flex flex-col gap-4 sm:gap-6 min-w-0">
                <div className="resume-card-header">
                    <div className="flex flex-col gap-1 sm:gap-2 min-w-0">
                        {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                        {jobTitle && <h3 className="text-base sm:text-lg break-words text-gray-500">{jobTitle}</h3>}
                        {!companyName && !jobTitle && <h2 className="!text-black font-bold break-words">{originalName}</h2>}
                    </div>
                    <div className="flex-shrink-0 max-sm:scale-90 max-sm:origin-right">
                        {latest ? (
                            <ScoreCircle score={latest.feedback.overallScore} />
                        ) : (
                            <span className="text-sm text-gray-500">Not analyzed</span>
                        )}
                    </div>
                </div>
                {imageSrc && (
                    <div className="gradient-border animate-in fade-in duration-1000">
                        <div className="w-full h-full">
                            <img
                                src={imageSrc}
                                alt="resume"
                                className="w-full h-[220px] sm:h-[300px] xl:h-[350px] object-cover object-top rounded-lg"
                            />
                        </div>
                    </div>
                )}
            </Link>
            <div className="flex flex-row items-center justify-between gap-3">
                {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : <span />}
                <button type="button" onClick={handleDelete} disabled={isDeleting}
                        className="min-h-11 px-4 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer disabled:cursor-not-allowed">
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    )
}
export default ResumeCard
