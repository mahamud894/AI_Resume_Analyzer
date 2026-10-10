import mongoose from "mongoose";

// The AI feedback has exactly the shape of the `Feedback` type in frontend/types/index.d.ts
const tipSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["good", "improve"], required: true },
        tip: { type: String, required: true },
        explanation: { type: String, default: "" },
    },
    { _id: false }
);

const categorySchema = new mongoose.Schema(
    {
        score: { type: Number, min: 0, max: 100, required: true },
        tips: { type: [tipSchema], default: [] },
    },
    { _id: false }
);

const feedbackSchema = new mongoose.Schema(
    {
        overallScore: { type: Number, min: 0, max: 100, required: true },
        ATS: { type: categorySchema, required: true },
        toneAndStyle: { type: categorySchema, required: true },
        content: { type: categorySchema, required: true },
        structure: { type: categorySchema, required: true },
        skills: { type: categorySchema, required: true },
    },
    { _id: false }
);

const analysisSchema = new mongoose.Schema(
    {
        // FK → resumes._id  (one Resume has many Analyses)
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            required: true,
            index: true,
        },
        // FK → users._id  (kept here too so we can query a user's analyses directly)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        companyName: { type: String, trim: true, maxlength: 100, default: "" },
        jobTitle: { type: String, trim: true, maxlength: 100, required: true },
        jobDescription: { type: String, trim: true, maxlength: 10000, required: true },
        feedback: { type: feedbackSchema, required: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
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

export default mongoose.model("Analysis", analysisSchema);
