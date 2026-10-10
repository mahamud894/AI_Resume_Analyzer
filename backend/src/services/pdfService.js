// Extracts plain text from a PDF file so it can be sent to the AI model.
import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";

export async function extractPdfText(absolutePath) {
    const data = await fs.readFile(absolutePath);
    const parser = new PDFParse({ data });
    try {
        const result = await parser.getText();
        // Collapse extra blank lines/spaces to keep the prompt small
        return result.text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    } finally {
        await parser.destroy();
    }
}
