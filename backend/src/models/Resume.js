import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
    {
        // FK → users._id  (one User has many Resumes)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Paths are relative to the backend/ folder, e.g. "uploads/1720000000000-ab12cd.pdf"
        filePath: { type: String, required: true },
        imagePath: { type: String, default: null },
        originalName: { type: String, required: true, maxlength: 255 },
        fileSize: { type: Number, required: true },
        uploadDate: { type: Date, default: Date.now },
    },
    {
        toJSON: {
            virtuals: true,
            transform(_doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                // Hide server disk paths; the client uses fileUrl / imageUrl instead.
                delete ret.filePath;
                delete ret.imagePath;
                return ret;
            },
        },
    }
);

// Newest uploads first for the history page
resumeSchema.index({ userId: 1, uploadDate: -1 });

// Protected URLs the frontend uses to download the PDF and preview image
resumeSchema.virtual("fileUrl").get(function () {
    return `/api/resume/${this._id}/file`;
});
resumeSchema.virtual("imageUrl").get(function () {
    return this.imagePath ? `/api/resume/${this._id}/image` : null;
});

// "Virtual populate": lets us load all Analyses of a Resume with .populate("analyses")
// without storing an array of ids inside the Resume document.
resumeSchema.virtual("analyses", {
    ref: "Analysis",
    localField: "_id",
    foreignField: "resumeId",
});

export default mongoose.model("Resume", resumeSchema);
