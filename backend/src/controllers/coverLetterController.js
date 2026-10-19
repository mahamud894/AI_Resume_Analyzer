import Analysis from "../models/Analysis.js";
import CoverLetter from "../models/CoverLetter.js";
import ImprovedResume from "../models/ImprovedResume.js";
import { generateCoverLetter } from "../services/coverLetterService.js";
import ApiError from "../utils/ApiError.js";

// Finds an analysis that belongs to the logged-in user, or throws 404.
async function findOwnAnalysis(analysisId, userId) {
    const analysis = await Analysis.findOne({ _id: analysisId, userId });
    if (!analysis) throw ApiError.notFound("Analysis not found");
    return analysis;
}

// POST /api/resume/analysis/:analysisId/cover-letter
// body: { hiringManagerName?, companyAddress?, jobSource?, tone: "formal" | "modern" }
export async function createCoverLetter(req, res) {
    const analysis = await findOwnAnalysis(req.params.analysisId, req.user._id);
    const improved = await ImprovedResume.findOne({ analysisId: analysis._id, userId: req.user._id });
    if (!improved) throw ApiError.badRequest("Generate the improved resume first");

    const inputs = {
        hiringManagerName: req.body.hiringManagerName || "",
        companyAddress: req.body.companyAddress || "",
        jobSource: req.body.jobSource || "",
        tone: req.body.tone || "formal",
    };

    const letter = await generateCoverLetter({
        cv: improved.currentCv(), // the user's edited CV if they saved one, otherwise the AI version
        inputs,
        companyName: analysis.companyName,
        jobTitle: analysis.jobTitle,
        jobDescription: analysis.jobDescription,
    });

    // One letter per improved resume: regenerating replaces it (and discards old edits)
    const coverLetter = await CoverLetter.findOneAndReplace(
        { analysisId: analysis._id },
        {
            improvedResumeId: improved._id,
            analysisId: analysis._id,
            userId: req.user._id,
            inputs,
            letter,
            editedText: null,
        },
        { upsert: true, returnDocument: "after", runValidators: true }
    );

    res.status(201).json({ coverLetter });
}

// GET /api/resume/analysis/:analysisId/cover-letter
export async function getCoverLetter(req, res) {
    const analysis = await findOwnAnalysis(req.params.analysisId, req.user._id);
    const coverLetter = await CoverLetter.findOne({ analysisId: analysis._id, userId: req.user._id });
    if (!coverLetter) throw ApiError.notFound("No cover letter yet for this analysis");
    res.json({ coverLetter });
}

// PUT /api/resume/analysis/:analysisId/cover-letter   body: { editedText }
// Saves the user's own version. An empty string resets to the generated letter.
export async function saveCoverLetterEdit(req, res) {
    const analysis = await findOwnAnalysis(req.params.analysisId, req.user._id);
    const coverLetter = await CoverLetter.findOneAndUpdate(
        { analysisId: analysis._id, userId: req.user._id },
        { editedText: req.body.editedText.trim() || null },
        { returnDocument: "after", runValidators: true }
    );
    if (!coverLetter) throw ApiError.notFound("No cover letter yet for this analysis");
    res.json({ coverLetter });
}
