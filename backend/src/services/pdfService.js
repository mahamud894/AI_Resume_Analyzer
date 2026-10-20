// Extracts plain text from a PDF so it can be sent to the AI model.
import { PDFParse } from "pdf-parse";

// `data` is the PDF file as a Buffer (read from GridFS)
export async function extractPdfText(data) {
    // pdf-parse takes ownership of the bytes, so it gets its own copy
    const parser = new PDFParse({ data: new Uint8Array(data) });
    try {
        const result = await parser.getText();
        // Collapse extra blank lines/spaces to keep the prompt small
        return result.text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    } finally {
        await parser.destroy();
    }
}
