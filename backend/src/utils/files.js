// Small file-system helpers for the uploads/ folder.
import fs from "node:fs/promises";
import path from "node:path";
import { BACKEND_ROOT } from "../config/env.js";

// We store paths relative to backend/ in MongoDB (e.g. "uploads/123-abc.pdf")
// so the database does not depend on where the project lives on disk.
export const toStoredPath = (absolutePath) =>
    path.relative(BACKEND_ROOT, absolutePath).split(path.sep).join("/");

export const toAbsolutePath = (storedPath) => path.join(BACKEND_ROOT, storedPath);

export async function removeFiles(...storedPaths) {
    await Promise.all(
        storedPaths
            .filter(Boolean)
            .map((p) => fs.rm(toAbsolutePath(p), { force: true }).catch(() => {}))
    );
}

// Checks the first bytes of the file — a real PDF always starts with "%PDF-".
// This stops someone renaming e.g. an .exe to .pdf.
export async function isRealPdf(absolutePath) {
    const handle = await fs.open(absolutePath, "r");
    try {
        const { buffer } = await handle.read(Buffer.alloc(5), 0, 5, 0);
        return buffer.toString("ascii") === "%PDF-";
    } finally {
        await handle.close();
    }
}
