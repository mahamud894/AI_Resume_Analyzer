import Analysis from "../models/Analysis.js";
import "../models/CoverLetter.js"; // registers the model used by populate("coverLetter")
import ImprovedResume from "../models/ImprovedResume.js";
import Resume from "../models/Resume.js";
import { improveResume, normalizeEuropassCv } from "../services/europassService.js";
import { readFile } from "../services/fileStorage.js";
import { extractPdfText } from "../services/pdfService.js";
import ApiError from "../utils/ApiError.js";

// Adds `coverLetter: { id, improvedResumeId, updatedAt }` if a cover letter exists
const populateCoverLetter = { path: "coverLetter", select: "improvedResumeId updatedAt" };

// Finds an analysis that belongs to the logged-in user, or throws 404.
async function findOwnAnalysis(analysisId, userId) {
    const analysis = await Analysis.findOne({ _id: analysisId, userId });
    if (!analysis) throw ApiError.notFound("Analysis not found");
    return analysis;
}

// POST /api/resume/analysis/:analysisId/improve
// Generates (or regenerates) the Europass version of the resume behind this analysis.
export async function improve(req, res) {
    const analysis = await findOwnAnalysis(req.params.analysisId, req.user._id);
    const resume = await Resume.findOne({ _id: analysis.resumeId, userId: req.user._id });
    if (!resume) throw ApiError.notFound("Resume not found");

    const resumeText = await extractPdfText(await readFile(resume.fileId));
    if (resumeText.length < 50) {
        throw new ApiError(422, "Could not read enough text from this PDF to rewrite it.");
    }

    const { europassCv, changes } = await improveResume({
        resumeText,
        feedback: analysis.feedback,
        companyName: analysis.companyName,
        jobTitle: analysis.jobTitle,
        jobDescription: analysis.jobDescription,
    });

    // One improved resume per analysis: regenerating replaces the old one.
    // A single atomic "replace or insert" — safe even if two requests arrive at the same time.
    const improved = await ImprovedResume.findOneAndReplace(
        { analysisId: analysis._id },
        {
            analysisId: analysis._id,
            resumeId: resume._id,
            userId: req.user._id,
            europassCv,
            changes,
            createdAt: new Date(),
        },
        { upsert: true, returnDocument: "after", runValidators: true }
    ).populate(populateCoverLetter);
    // (findOneAndReplace keeps the same _id, so an existing cover letter stays linked.
    //  The user's previous inline edits — editedCv — are discarded, because the CV is new.)

    res.status(201).json({ improved });
}

// GET /api/resume/analysis/:analysisId/improved
export async function getImproved(req, res) {
    const analysis = await findOwnAnalysis(req.params.analysisId, req.user._id);
    const improved = await ImprovedResume.findOne({ analysisId: analysis._id, userId: req.user._id })
        .populate(populateCoverLetter);
    if (!improved) throw ApiError.notFound("No improved resume yet for this analysis");
    res.json({ improved });
}

const MAX_CV_BYTES = 100 * 1024;

// PUT /api/resume/analysis/:analysisId/improved   body: { europassCv: {...} | null }
// Saves the user's inline edits. The AI original stays in `europassCv`; null resets to it.
export async function saveImprovedEdit(req, res) {
    const analysis = await findOwnAnalysis(req.params.analysisId, req.user._id);
    const { europassCv } = req.body;

    let editedCv = null;
    if (europassCv !== null) {
        if (Buffer.byteLength(JSON.stringify(europassCv)) > MAX_CV_BYTES) {
            throw new ApiError(413, "The edited CV is too large");
        }
        editedCv = normalizeEuropassCv(europassCv); // same shape as the AI version, unknown fields dropped
    }

    const improved = await ImprovedResume.findOneAndUpdate(
        { analysisId: analysis._id, userId: req.user._id },
        { editedCv, editedAt: editedCv ? new Date() : null },
        { returnDocument: "after" }
    ).populate(populateCoverLetter);
    if (!improved) throw ApiError.notFound("No improved resume yet for this analysis");
    res.json({ improved });
}
