// One-time move of uploaded resumes from the old backend/uploads/ folder into MongoDB GridFS.
//
//     cd backend
//     npm run migrate:uploads              # shows what it would do, changes nothing
//     npm run migrate:uploads -- --apply   # really moves the files
//
// Resumes stored before the switch have `filePath` / `imagePath` (paths on disk); afterwards they
// need `fileId` / `imageId`. Running it again is safe: already-moved resumes are skipped.
// The files in backend/uploads/ are left in place; delete them by hand once the app works.
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import config, { BACKEND_ROOT } from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { saveFile } from "../src/services/fileStorage.js";

const apply = process.argv.includes("--apply");

async function readIfExists(storedPath) {
    if (!storedPath) return null;
    try {
        return await fs.readFile(path.join(BACKEND_ROOT, storedPath));
    } catch {
        return null;
    }
}

await connectDB();
// Raw collection: the Resume model no longer knows filePath / imagePath
const resumes = mongoose.connection.collection("resumes");
const todo = await resumes.find({ filePath: { $exists: true }, fileId: { $exists: false } }).toArray();
console.log(`${todo.length} resume(s) still use the disk folder ${config.uploadDir}`);

let moved = 0;
for (const r of todo) {
    const pdf = await readIfExists(r.filePath);
    const image = await readIfExists(r.imagePath);
    if (!pdf) {
        console.warn(`  ⚠️  ${r._id} "${r.originalName}": PDF ${r.filePath} not found on disk, skipped`);
        continue;
    }
    console.log(`  ${apply ? "→" : "would move"} ${r._id} "${r.originalName}" (${pdf.length} B${image ? ` + preview ${image.length} B` : ", no preview"})`);
    if (!apply) continue;

    const owner = { userId: r.userId };
    const fileId = await saveFile(pdf, { filename: r.originalName, contentType: "application/pdf", ...owner });
    const imageId = image
        ? await saveFile(image, {
              filename: path.basename(r.imagePath),
              contentType: r.imagePath.endsWith(".png") ? "image/png" : "image/jpeg",
              ...owner,
          })
        : null;
    await resumes.updateOne({ _id: r._id }, { $set: { fileId, imageId }, $unset: { filePath: "", imagePath: "" } });
    moved += 1;
}

console.log(apply ? `✅ Moved ${moved} resume(s) to GridFS.` : "Dry run only. Add -- --apply to move them.");
await disconnectDB();
