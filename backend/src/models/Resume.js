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
        // The PDF and its page-1 preview are stored in MongoDB GridFS (bucket "uploads", see
        // services/fileStorage.js); these are their ids in uploads.files
        fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
        imageId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
                // Internal storage ids; the client uses the protected fileUrl / imageUrl instead.
                delete ret.fileId;
                delete ret.imageId;
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
    return this.imageId ? `/api/resume/${this._id}/image` : null;
});

// "Virtual populate": lets us load all Analyses of a Resume with .populate("analyses")
// without storing an array of ids inside the Resume document.
resumeSchema.virtual("analyses", {
    ref: "Analysis",
    localField: "_id",
    foreignField: "resumeId",
});

export default mongoose.model("Resume", resumeSchema);
