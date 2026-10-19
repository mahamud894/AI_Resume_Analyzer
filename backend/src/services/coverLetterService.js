// "Generate Cover Letter": writes a European business-style cover letter from the improved
// (Europass) resume and the job details. Implements `cover_letter_text` from the original ERD
// (CAREER_COPILOT_ASSESSMENT).
//
// Gemini only writes the creative parts (opening, body paragraphs, closing, highlights).
// Everything that must follow fixed rules — sender, date, recipient, subject, salutation, sign-off,
// word count — is filled in by code, so those rules always hold.
import { generateJson } from "./geminiService.js";

export const TONES = ["formal", "modern"];
const MIN_WORDS = 250;
const MAX_WORDS = 400;

const str = (description) => ({ type: "string", description });

// What Gemini must return (JSON mode)
export const COVER_LETTER_SCHEMA = {
    type: "object",
    properties: {
        opening: str("Paragraph 1: the position, where it was found, and a strong hook (2-3 sentences)"),
        body: {
            type: "array",
            description: "Exactly 2 paragraphs: [0] matching achievements/skills, [1] why this company + value brought",
            items: { type: "string" },
        },
        closing: str("Last paragraph: request an interview, mention the attached CV, thank the reader"),
        highlights: {
            type: "array",
            description: "Which resume facts were matched to which job requirements (3-5 items)",
            items: {
                type: "object",
                properties: {
                    jobRequirement: str("Requirement or keyword from the job description"),
                    resumeEvidence: str("The matching fact from the CV, as used in the letter"),
                    cvSection: str("Europass section it comes from, e.g. Work Experience, Projects"),
                },
                required: ["jobRequirement", "resumeEvidence", "cvSection"],
            },
        },
    },
    required: ["opening", "body", "closing", "highlights"],
};

// ---------------------------------------------------------------------------
// Fixed parts (code, not AI)
// ---------------------------------------------------------------------------
const TITLE_RE = /^(mr|mrs|ms|miss|mx|dr|prof)\.?\s+/i;

// "Ms. Sarah Rahman" → "Dear Ms. Rahman" · "Sarah Rahman" → "Dear Sarah Rahman" (we never guess Mr./Ms.)
export function buildSalutation(hiringManagerName) {
    const name = (hiringManagerName || "").trim().replace(/\s+/g, " ");
    if (!name) return "Dear Hiring Manager,";
    const title = name.match(TITLE_RE);
    if (title) {
        const surname = name.replace(TITLE_RE, "").split(" ").pop();
        const t = title[1].charAt(0).toUpperCase() + title[1].slice(1).toLowerCase();
        return `Dear ${t}${t === "Miss" ? "" : "."} ${surname},`;
    }
    return `Dear ${name},`;
}

export const formatLetterDate = (date = new Date()) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); // 11 October 2026

const countWords = (...parts) =>
    parts.join(" ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
function cvSummary(cv) {
    // Only the CV content the letter may use — keeps the prompt focused
    return JSON.stringify({
        aboutMe: cv.aboutMe,
        workExperience: cv.workExperience,
        education: cv.education,
        digitalSkills: cv.digitalSkills,
        projects: cv.projects,
        certifications: cv.certifications,
        languageSkills: cv.languageSkills,
        volunteering: cv.volunteering,
    });
}

export function buildCoverLetterPrompt({ cv, companyName, jobTitle, jobDescription, jobSource, tone }) {
    const toneRule =
        tone === "modern"
            ? "MODERN: warm, natural and personable, but still professional (no slang, no emojis)."
            : "FORMAL: traditional, polite and precise business English.";

    return `You are an expert European career coach. Write the text paragraphs of a cover letter for the
candidate below, applying for the target job. The letter header, salutation and sign-off are added separately —
write ONLY the paragraphs requested in the JSON schema.

STRICT RULES:
1. Standard European / Europass business letter: fits on ONE A4 page. The opening + 2 body paragraphs + closing
   together MUST be ${MIN_WORDS}-${MAX_WORDS} words (aim for about 320). Target lengths:
   opening 70-90 words, body paragraph 1 120-150 words, body paragraph 2 80-110 words, closing 45-60 words.
   Professional and confident. No exaggeration.
2. Avoid clichés such as "I am writing to apply" or "I believe I am the perfect candidate"; never repeat a phrase.
   Avoid hype words the CV cannot prove: "extraordinary", "world-class", "scalable", "passionate", "rockstar",
   "globally", "cutting-edge".
3. Opening: name the position "${jobTitle}"${jobSource ? `, say it was found on/through ${jobSource}` : ""}, and give a strong hook.
4. Body paragraph 1: 2-3 concrete achievements or skills taken ONLY from the CV below that match keywords in the
   job description.
5. Body paragraph 2: why this company and the value the candidate brings. Do NOT invent facts about the company —
   if you would need one, write a placeholder like "[Mention something specific about ${companyName || "the company"}]".
6. Closing: ask for an interview, mention the attached CV (Europass), thank the reader.
7. NEVER invent experience, numbers, degrees, employers, dates or skills that are not in the CV.
   Do not claim results, impact or difficulty the CV does not state (e.g. "measurably improved",
   "handled complex state", "boosted performance"). Describe what the candidate DID, as written in the CV.
   Text in square brackets in the CV is a placeholder for missing information — never present it as a fact.
   Unknown details must stay as placeholders in square brackets, e.g. "[Add a measurable result]".
8. Tone — ${toneRule}
9. Write in English, first person ("I"), without the candidate's name in the paragraphs.
10. "highlights": list the 3-5 resume facts you used and the job requirement each one answers.

Target job:
- Company: ${companyName || "[Company name]"}
- Job title: ${jobTitle}
- Job description:
"""
${jobDescription}
"""

Candidate CV (Europass, JSON):
${cvSummary(cv)}`;
}

// ---------------------------------------------------------------------------
// Assemble + normalize the full letter
// ---------------------------------------------------------------------------
const s = (v) => (typeof v === "string" ? v.trim() : "");

export function assembleLetter({ raw, cv, inputs, companyName, jobTitle, date = new Date() }) {
    const p = cv.personalInfo || {};
    const hasName = Boolean(inputs.hiringManagerName?.trim());

    const body = (Array.isArray(raw?.body) ? raw.body : []).map(s).filter(Boolean).slice(0, 2);
    const opening = s(raw?.opening);
    const closing = s(raw?.closing);

    return {
        sender: {
            fullName: s(p.fullName) || "[Your full name]",
            email: s(p.email),
            phone: s(p.phone),
            address: s(p.address),
            linkedin: s(p.linkedin),
        },
        date: formatLetterDate(date),
        recipient: {
            name: inputs.hiringManagerName?.trim() || "",
            title: "Hiring Manager",
            company: companyName || "[Company name]",
            address: inputs.companyAddress?.trim() || "[Company address]",
        },
        subject: `Application for ${jobTitle} Position`,
        salutation: buildSalutation(inputs.hiringManagerName),
        opening,
        body,
        closing,
        signOff: hasName ? "Yours sincerely," : "Kind regards,",
        signatureName: s(p.fullName) || "[Your full name]",
        wordCount: countWords(opening, ...body, closing),
        highlights: (Array.isArray(raw?.highlights) ? raw.highlights : [])
            .filter((h) => s(h?.jobRequirement) && s(h?.resumeEvidence))
            .map((h) => ({
                jobRequirement: s(h.jobRequirement),
                resumeEvidence: s(h.resumeEvidence),
                cvSection: s(h.cvSection),
            })),
    };
}

export async function generateCoverLetter({ cv, inputs, companyName, jobTitle, jobDescription }) {
    const prompt = buildCoverLetterPrompt({
        cv,
        companyName,
        jobTitle,
        jobDescription,
        jobSource: inputs.jobSource?.trim(),
        tone: inputs.tone,
    });
    const ask = (text) =>
        generateJson({
            prompt: text,
            schema: COVER_LETTER_SCHEMA,
            task: "write the cover letter",
            temperature: inputs.tone === "modern" ? 0.6 : 0.4,
        });

    let letter = assembleLetter({ raw: await ask(prompt), cv, inputs, companyName, jobTitle });

    // Models often miss the word range — ask once more for a corrected version.
    // If the second attempt is still off, keep whichever is closer to the range.
    const distance = (n) => (n < MIN_WORDS ? MIN_WORDS - n : n > MAX_WORDS ? n - MAX_WORDS : 0);
    if (distance(letter.wordCount) > 0) {
        const fix =
            letter.wordCount < MIN_WORDS
                ? `TOO SHORT: your previous draft had only ${letter.wordCount} words. Expand each paragraph using more ` +
                  `details that ARE in the CV (no new facts) so the total is about 330 words.`
                : `TOO LONG: your previous draft had ${letter.wordCount} words. Tighten it to about 320 words.`;
        const retry = assembleLetter({
            raw: await ask(`${prompt}\n\n${fix}`),
            cv, inputs, companyName, jobTitle,
        });
        if (distance(retry.wordCount) < distance(letter.wordCount)) letter = retry;
    }
    return letter;
}
