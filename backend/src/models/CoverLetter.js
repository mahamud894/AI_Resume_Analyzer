import mongoose from "mongoose";
import { TONES } from "../services/coverLetterService.js";

export const MAX_EDITED_TEXT = 8000;

// Implements `cover_letter_text` from the original ERD (CAREER_COPILOT_ASSESSMENT):
// the generated letter (`letter`) plus the user's own edited version (`editedText`).
const coverLetterSchema = new mongoose.Schema(
    {
        // FK → improvedresumes._id  (one cover letter per improved resume — regenerating replaces it)
        improvedResumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ImprovedResume",
            required: true,
            unique: true,
        },
        // FK → analyses._id (1:1 as well, since an analysis has at most one improved resume)
        analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "Analysis", required: true, unique: true },
        // FK → users._id (ownership checks)
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        // What the user typed in the form before generating
        inputs: {
            hiringManagerName: { type: String, trim: true, maxlength: 100, default: "" },
            companyAddress: { type: String, trim: true, maxlength: 300, default: "" },
            jobSource: { type: String, trim: true, maxlength: 100, default: "" },
            tone: { type: String, enum: TONES, default: "formal" },
        },
        // Generated letter: { sender, date, recipient, subject, salutation, opening, body[], closing,
        // signOff, signatureName, wordCount, highlights[] } — shape guaranteed by assembleLetter()
        letter: { type: mongoose.Schema.Types.Mixed, required: true },
        // The user's own edited version (plain text). null = use the generated letter.
        editedText: { type: String, maxlength: MAX_EDITED_TEXT, default: null },
    },
    {
        timestamps: true, // createdAt = generated, updatedAt = last edit
        minimize: false,
        toJSON: {
            transform(_doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

export default mongoose.model("CoverLetter", coverLetterSchema);
