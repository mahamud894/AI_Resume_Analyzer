// Sends the resume text + job details to Google Gemini and returns structured feedback.
//
// We use Gemini's "JSON mode" (responseMimeType + responseJsonSchema): the model is forced
// to answer with JSON that matches FEEDBACK_SCHEMA, which is exactly the `Feedback` type the
// frontend components (Summary, ATS, Details, ScoreCircle) expect.
import { GoogleGenAI } from "@google/genai";
import config from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const MAX_RESUME_CHARS = 30000;

const tipsWithExplanation = {
    type: "array",
    items: {
        type: "object",
        properties: {
            type: { type: "string", enum: ["good", "improve"] },
            tip: { type: "string", description: "Short title of the tip (max ~8 words)" },
            explanation: { type: "string", description: "Detailed explanation (1-3 sentences)" },
        },
        required: ["type", "tip", "explanation"],
    },
};

const category = {
    type: "object",
    properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        tips: tipsWithExplanation,
    },
    required: ["score", "tips"],
};

export const FEEDBACK_SCHEMA = {
    type: "object",
    properties: {
        overallScore: { type: "integer", minimum: 0, maximum: 100 },
        ATS: {
            type: "object",
            properties: {
                score: { type: "integer", minimum: 0, maximum: 100 },
                tips: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["good", "improve"] },
                            tip: { type: "string" },
                        },
                        required: ["type", "tip"],
                    },
                },
            },
            required: ["score", "tips"],
        },
        toneAndStyle: category,
        content: category,
        structure: category,
        skills: category,
    },
    required: ["overallScore", "ATS", "toneAndStyle", "content", "structure", "skills"],
};

export function buildPrompt({ resumeText, companyName, jobTitle, jobDescription }) {
    return `You are an expert in ATS (Applicant Tracking System) and resume analysis.
Analyze and rate the resume below against the target job, and suggest how to improve it.

Rules:
- Be thorough and honest. Do not be afraid to give low scores if the resume is weak.
- All scores are integers from 0 to 100.
- For every category give 3-4 tips. Mix "good" (strengths) and "improve" (weaknesses).
- ATS tips only need "type" and "tip". Every other category's tips also need an "explanation".
- Use the job description to judge relevance of skills, keywords and experience.

Target job:
- Company: ${companyName || "Not specified"}
- Job title: ${jobTitle}
- Job description:
"""
${jobDescription}
"""

Resume (plain text extracted from the candidate's PDF):
"""
${resumeText.slice(0, MAX_RESUME_CHARS)}
"""`;
}

// Makes sure the result really has the expected shape before we save it.
// Clamps scores into 0-100 and drops malformed tips, so a slightly off answer never breaks the UI.
export function normalizeFeedback(raw) {
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const cleanTips = (tips, withExplanation) =>
        (Array.isArray(tips) ? tips : [])
            .filter((t) => t && typeof t.tip === "string" && t.tip.trim())
            .map((t) => ({
                type: t.type === "good" ? "good" : "improve",
                tip: t.tip.trim(),
                ...(withExplanation ? { explanation: String(t.explanation ?? "").trim() } : {}),
            }));
    const cat = (c, withExplanation = true) => ({
        score: clamp(c?.score),
        tips: cleanTips(c?.tips, withExplanation),
    });

    if (!raw || typeof raw !== "object") {
        throw new ApiError(502, "AI returned an invalid response. Please try again.");
    }

    return {
        overallScore: clamp(raw.overallScore),
        ATS: cat(raw.ATS, false),
        toneAndStyle: cat(raw.toneAndStyle),
        content: cat(raw.content),
        structure: cat(raw.structure),
        skills: cat(raw.skills),
    };
}

let client = null;
function getClient() {
    if (!config.geminiApiKey) {
        throw new ApiError(503, "AI service is not configured (GEMINI_API_KEY is missing).");
    }
    client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
    return client;
}

// Gemini's free tier sometimes answers 500/503 ("high demand") for a few seconds.
// Those are temporary, so we retry a few times with a growing pause before giving up.
const MAX_ATTEMPTS = 3;
const isTemporary = (err) => [500, 503, 504].includes(err.status);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeResume(input) {
    const ai = getClient();

    let response;
    for (let attempt = 1; ; attempt++) {
        try {
            response = await ai.models.generateContent({
                model: config.geminiModel,
                contents: buildPrompt(input),
                config: {
                    responseMimeType: "application/json",
                    responseJsonSchema: FEEDBACK_SCHEMA,
                    temperature: 0.2,
                },
            });
            break;
        } catch (err) {
            console.error(`Gemini API error (attempt ${attempt}/${MAX_ATTEMPTS}):`, err.message);
            if (isTemporary(err) && attempt < MAX_ATTEMPTS) {
                await sleep(2000 * attempt); // 2s, then 4s
                continue;
            }
            if (/API_KEY_INVALID|API key not valid/i.test(err.message)) {
                throw new ApiError(503, "AI service is misconfigured (GEMINI_API_KEY is invalid).");
            }
            if (err.status === 429) {
                throw new ApiError(429, "AI rate limit reached. Please wait a minute and try again.");
            }
            if (isTemporary(err)) {
                throw new ApiError(503, "The AI model is busy right now. Please try again in a minute.");
            }
            throw new ApiError(502, "AI service failed to analyze the resume. Please try again.");
        }
    }

    let parsed;
    try {
        parsed = JSON.parse(response.text);
    } catch {
        throw new ApiError(502, "AI returned invalid JSON. Please try again.");
    }
    return normalizeFeedback(parsed);
}
