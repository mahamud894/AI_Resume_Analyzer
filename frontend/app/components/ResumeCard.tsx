import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useProtectedFile} from "~/lib/hooks";

const ResumeCard = ({ resume: { id, imageUrl, analyses, originalName } }: { resume: Resume }) => {
    const imageSrc = useProtectedFile(imageUrl);
    // Each card shows the most recent analysis of this resume
    const latest = analyses[0];
    const companyName = latest?.companyName;
    const jobTitle = latest?.jobTitle;

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                    {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                    {!companyName && !jobTitle && <h2 className="!text-black font-bold break-words">{originalName}</h2>}
                </div>
                <div className="flex-shrink-0">
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
                            className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
                        />
                    </div>
                </div>
                )}
        </Link>
    )
}
export default ResumeCard
