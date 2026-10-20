// The "which job is this for?" fields, shared by the upload page and "Analyze for another job".
// Limits match analyzeRules in backend/src/middleware/validate.js.

export type JobDetails = { companyName: string; jobTitle: string; jobDescription: string };

// Reads and checks the fields of a form that contains <JobFields />
export function readJobDetails(form: HTMLFormElement): { job: JobDetails; error?: undefined } | { job?: undefined; error: string } {
    const formData = new FormData(form);
    const companyName = String(formData.get('company-name') || '').trim();
    const jobTitle = String(formData.get('job-title') || '').trim();
    const jobDescription = String(formData.get('job-description') || '').trim();

    if (!jobTitle) return { error: 'Please enter the job title.' };
    if (jobDescription.length < 20) return { error: 'Please paste the job description (at least 20 characters).' };
    return { job: { companyName, jobTitle, jobDescription } };
}

const JobFields = () => (
    <>
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
            <textarea rows={6} className="resize-y md:min-h-[220px] lg:min-h-[260px]" name="job-description" placeholder="Job Description" id="job-description" maxLength={10000} required />
        </div>
    </>
);

export default JobFields;
