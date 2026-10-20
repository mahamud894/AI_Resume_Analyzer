// Stores uploaded files (resume PDFs and preview images) inside MongoDB Atlas with GridFS,
// instead of on the server's disk. Hosts like Render's free plan wipe the disk on every restart
// or deploy; the database keeps the files, so they survive.
//
// GridFS splits each file into 255 KB chunks in two collections: uploads.files and uploads.chunks.
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

const BUCKET = "uploads";

// Created per call (cheap): the bucket must belong to the current connection
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

const toId = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id)));

// Saves a Buffer and returns the new file's ObjectId
export function saveFile(buffer, { filename, contentType, userId }) {
    return new Promise((resolve, reject) => {
        // The MongoDB driver no longer stores a top-level contentType, so it goes into metadata
        const upload = bucket().openUploadStream(filename, { metadata: { contentType, userId } });
        upload.once("error", reject);
        upload.once("finish", () => resolve(upload.id));
        upload.end(buffer);
    });
}

// File info ({ _id, length, filename, metadata: { contentType, userId } }) or null when it does not exist
async function findFile(id) {
    // e.g. an old resume whose file could not be migrated has no id at all
    if (!id || !mongoose.Types.ObjectId.isValid(String(id))) return null;
    const [file] = await bucket().find({ _id: toId(id) }).limit(1).toArray();
    return file || null;
}

// Reads a whole file into memory (resumes are at most a few MB) — used to extract the PDF text
export async function readFile(id) {
    if (!(await findFile(id))) throw ApiError.notFound("File not found");
    const chunks = [];
    for await (const chunk of bucket().openDownloadStream(toId(id))) chunks.push(chunk);
    return Buffer.concat(chunks);
}

// Streams a file to the HTTP response with the right headers. 404 (JSON) when it is missing.
export async function sendFile(res, id, { contentType, disposition } = {}) {
    const file = await findFile(id);
    if (!file) throw ApiError.notFound("File not found");

    res.setHeader("Content-Type", contentType || file.metadata?.contentType || "application/octet-stream");
    res.setHeader("Content-Length", file.length);
    if (disposition) res.setHeader("Content-Disposition", disposition);

    await new Promise((resolve, reject) => {
        bucket().openDownloadStream(file._id).on("error", reject).pipe(res).on("finish", resolve).on("error", reject);
    });
}

// Deletes files, ignoring ids that are empty or already gone
export async function deleteFiles(...ids) {
    await Promise.all(
        ids.filter(Boolean).map((id) => bucket().delete(toId(id)).catch(() => {}))
    );
}

// A real PDF always starts with "%PDF-". This stops someone renaming e.g. an .exe to .pdf.
export const isRealPdf = (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-";
