import Analysis from "../models/Analysis.js";
import Resume from "../models/Resume.js";
import { analyzeResume } from "../services/geminiService.js";
import { extractPdfText } from "../services/pdfService.js";
import ApiError from "../utils/ApiError.js";
import { isRealPdf, removeFiles, toAbsolutePath, toStoredPath } from "../utils/files.js";

// Newest analysis first whenever we populate a resume's analyses
const populateAnalyses = { path: "analyses", options: { sort: { createdAt: -1 } } };

// Finds a resume that belongs to the logged-in user, or throws 404.
// (Returning 404 instead of 403 for other users' resumes hides that the id exists.)
async function findOwnResume(id, userId) {
    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) throw ApiError.notFound("Resume not found");
    return resume;
}

// POST /api/resume/upload   (multipart/form-data: resume=<pdf>, image=<png, optional>)
export async function uploadResume(req, res) {
    const pdf = req.files?.resume?.[0];
    const image = req.files?.image?.[0];
    const storedPdf = pdf && toStoredPath(pdf.path);
    const storedImage = image && toStoredPath(image.path);

    try {
        if (!pdf) throw ApiError.badRequest('A PDF file is required in the "resume" field');
        if (!(await isRealPdf(pdf.path))) throw ApiError.badRequest("Uploaded file is not a valid PDF");

        const resume = await Resume.create({
            userId: req.user._id,
            filePath: storedPdf,
            imagePath: storedImage || null,
            originalName: pdf.originalname,
            fileSize: pdf.size,
        });
        res.status(201).json({ resume });
    } catch (err) {
        await removeFiles(storedPdf, storedImage); // don't leave orphan files behind
        throw err;
    }
}

// POST /api/resume/analyze   { resumeId, companyName, jobTitle, jobDescription }
export async function analyze(req, res) {
    const { resumeId, companyName = "", jobTitle, jobDescription } = req.body;
    const resume = await findOwnResume(resumeId, req.user._id);

    const resumeText = await extractPdfText(toAbsolutePath(resume.filePath));
    if (resumeText.length < 50) {
        throw new ApiError(
            422,
            "Could not read enough text from this PDF. Is it a scanned image? Please upload a text-based PDF."
        );
    }

    const feedback = await analyzeResume({ resumeText, companyName, jobTitle, jobDescription });

    const analysis = await Analysis.create({
        resumeId: resume._id,
        userId: req.user._id,
        companyName,
        jobTitle,
        jobDescription,
        feedback,
    });

    res.status(201).json({ analysis });
}

// GET /api/resume   → the logged-in user's history (each resume with its analyses)
export async function listResumes(req, res) {
    const resumes = await Resume.find({ userId: req.user._id })
        .sort({ uploadDate: -1 })
        .populate(populateAnalyses);
    res.json({ resumes });
}

// GET /api/resume/:id
export async function getResume(req, res) {
    const resume = await findOwnResume(req.params.id, req.user._id);
    await resume.populate(populateAnalyses);
    res.json({ resume });
}

// GET /api/resume/:id/file   → the original PDF
export async function getResumeFile(req, res) {
    const resume = await findOwnResume(req.params.id, req.user._id);
    res.type("application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(resume.originalName)}"`);
    res.sendFile(toAbsolutePath(resume.filePath));
}

// GET /api/resume/:id/image   → the page-1 preview image
export async function getResumeImage(req, res) {
    const resume = await findOwnResume(req.params.id, req.user._id);
    if (!resume.imagePath) throw ApiError.notFound("This resume has no preview image");
    res.sendFile(toAbsolutePath(resume.imagePath));
}

// DELETE /api/resume/:id   → removes the resume, all its analyses and the files on disk
export async function deleteResume(req, res) {
    const resume = await findOwnResume(req.params.id, req.user._id);

    await Analysis.deleteMany({ resumeId: resume._id });
    await resume.deleteOne();
    await removeFiles(resume.filePath, resume.imagePath);

    res.json({ message: "Resume deleted", id: resume.id });
}
