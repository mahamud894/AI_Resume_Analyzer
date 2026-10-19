// "Improve My Resume": rewrites a resume in the official EU Europass CV structure,
// using the saved AI feedback and the job description, and reports every change it made.
//
// Two layers make sure the result follows the Europass rules:
//   1. the prompt + JSON schema tell Gemini what to do;
//   2. postCheck() enforces the most important rules in code afterwards (numbers, dates,
//      qualification names, EQF levels, grades, phone format), because a model can ignore a prompt.
import { generateJson } from "./geminiService.js";

const MAX_RESUME_CHARS = 30000;
export const CHANGE_CATEGORIES = ["ATS", "toneAndStyle", "content", "structure", "skills"];
const CEFR_FIELDS = ["listening", "reading", "spokenProduction", "spokenInteraction", "writing"];

// ---------------------------------------------------------------------------
// JSON schema Gemini must follow (JSON mode). Mirrors the EuropassCv type in
// frontend/types/index.d.ts.
// ---------------------------------------------------------------------------
const str = (description) => ({ type: "string", ...(description ? { description } : {}) });
const strArray = (description) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) });
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties) });

const DATE = 'MM/YYYY (or YYYY only if the month is unknown). Use a placeholder like "[Add start date MM/YYYY]" if unknown.';
const CEFR = 'CEFR level A1, A2, B1, B2, C1 or C2 — or a placeholder like "[Add level, e.g. B2]" if the resume does not state it';

export const EUROPASS_SCHEMA = obj({
    europassCv: obj({
        personalInfo: obj({
            fullName: str(),
            email: str(),
            phone: str('International format with spaces, e.g. "+880 1846 650807"'),
            address: str("City, country — or a placeholder"),
            linkedin: str('Full URL, or "" if the resume has none'),
            github: str('Full URL, or "" if the resume has none'),
            website: str('Full URL, or "" if the resume has none'),
        }),
        aboutMe: str(
            "2-4 sentence professional summary tailored to the target job, based only on real resume content. " +
                "Use the candidate's real job titles / status exactly as in the resume."
        ),
        workExperience: {
            type: "array",
            description: "Reverse chronological order (newest first)",
            items: obj({
                startDate: str(DATE),
                endDate: str(`${DATE} "Current" ONLY if the resume says the job is ongoing (Present/Current).`),
                jobTitle: str("EXACTLY as written in the original resume — never upgrade or rename it"),
                employer: str(),
                city: str(),
                country: str(),
                responsibilities: strArray("Bullet points starting with strong action verbs"),
            }),
        },
        education: {
            type: "array",
            description: "Education AND training, reverse chronological order (newest first)",
            items: obj({
                startDate: str(DATE),
                endDate: str(
                    `${DATE} Ongoing degree: "Expected MM/YYYY" if the resume gives a graduation date, otherwise ` +
                        `"[Expected graduation date]". Ongoing training: "Current" only if the resume says so.`
                ),
                qualification: str(
                    'Full name for European readers, e.g. "Bachelor of Science (B.Sc.) in Computer Science and Engineering", ' +
                        '"Higher Secondary Certificate (HSC) – Science", "Secondary School Certificate (SSC)"'
                ),
                institution: str(),
                city: str(),
                country: str(),
                fieldOfStudy: str('"" if it is already part of the qualification title'),
                grade: str('Only if stated, with its scale: "GPA 4.67 / 5.00" (SSC/HSC), "CGPA 3.50 / 4.00" (university); otherwise ""'),
                eqfLevel: str('European Qualifications Framework level: SSC "3", HSC "4", Bachelor "6", Master "7", PhD "8"; "" for short trainings/courses'),
            }),
        },
        languageSkills: obj({
            motherTongue: strArray('Only if stated in the resume, otherwise ["[Add your mother tongue]"]'),
            otherLanguages: {
                type: "array",
                description:
                    'Languages stated in the resume. If none are stated, ONE entry with language "[Add a language you speak, e.g. English]" and placeholder levels',
                items: obj({
                    language: str(),
                    listening: str(CEFR),
                    reading: str(CEFR),
                    spokenProduction: str(CEFR),
                    spokenInteraction: str(CEFR),
                    writing: str(CEFR),
                }),
            },
        }),
        digitalSkills: strArray(
            "Technical / digital skills that literally appear in the original resume, GROUPED into 3-7 lines " +
                "(keep the resume's own groups if it has them), e.g. 'Front-end: HTML, CSS, JavaScript'"
        ),
        projects: {
            type: "array",
            items: obj({
                name: str(),
                description: str(),
                technologies: strArray(),
                link: str('URL, or "" if none'),
            }),
        },
        certifications: {
            type: "array",
            items: obj({ name: str(), issuer: str(), date: str() }),
        },
        communicationSkills: str('Only if supported by the resume, otherwise ""'),
        organisationalSkills: str('Only if supported by the resume, otherwise ""'),
        volunteering: strArray('Only real volunteering from the resume; empty array if none'),
        references: str('e.g. "Available upon request"'),
    }),
    changes: {
        type: "array",
        description: "One entry for every improvement made, covering every 'improve' tip of the feedback",
        items: {
            type: "object",
            properties: {
                section: str("Europass section that changed, e.g. Work Experience"),
                category: { type: "string", enum: CHANGE_CATEGORIES },
                before: str("Original text (short quote), or \"(missing)\" if it did not exist"),
                after: str("The new text exactly as it now appears in the CV (a quote, not a description of the change)"),
                reason: str("Why — mention the feedback tip or job requirement it addresses"),
            },
            required: ["section", "category", "before", "after", "reason"],
        },
    },
});

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
function improveTips(feedback) {
    const lines = [];
    for (const category of CHANGE_CATEGORIES) {
        for (const tip of feedback?.[category]?.tips ?? []) {
            if (tip.type !== "improve") continue;
            lines.push(`- [${category}] ${tip.tip}${tip.explanation ? ` — ${tip.explanation}` : ""}`);
        }
    }
    return lines.length ? lines.join("\n") : "- (no improvement tips)";
}

export function buildImprovePrompt({ resumeText, feedback, companyName, jobTitle, jobDescription }) {
    return `You are an expert career coach and Europass CV writer.
Rewrite the candidate's resume below into the official EU Europass CV structure, improved for the target job.

STRICT RULES — follow every one:
1. NEVER invent experience, jobs, degrees, companies, institutions, dates, numbers, certifications or skills
   that are not in the original resume. Every fact must come from the original text.
   Do NOT infer facts either: e.g. do not guess the mother tongue from the country, and do not add
   related technologies (e.g. HTML5/CSS3 because the resume says Tailwind CSS).
2. Job titles must stay EXACTLY as in the original resume — never upgrade or rename them
   (e.g. "SEO Content Writer" must NOT become "SEO Specialist"; "Student" must NOT become "Developer").
   This also applies to "aboutMe": describe the candidate with their real titles/status only,
   and avoid unprovable claims such as "Proven ability", "Expert in", "Results-driven".
3. Rewrite bullet points with strong action verbs (Built, Designed, Led, Reduced, ...). A rewritten bullet
   must keep the SAME meaning — do not add new claims (e.g. "cross-browser", "high-performance",
   "scalable") that the original text does not support.
4. Add keywords from the job description ONLY where the resume shows the candidate really has that skill.
   "digitalSkills" may contain ONLY skills/tools that literally appear in the original resume.
5. NEVER add numbers or percentages that are not in the original text. Keep numbers that ARE in the resume.
   You may add a placeholder that asks the user for a number, e.g. "[Add a measurable result, e.g. ...]".
6. Dates: ALL dates in ONE format, MM/YYYY ("YYYY" only if the month is unknown). Convert e.g.
   "November 30, 2024" → "11/2024", "Dec 2024" → "12/2024". Ongoing degree: "Expected MM/YYYY" when the
   resume states an expected graduation date, otherwise "[Expected graduation date]". Use "Current" for an
   ongoing job or training ONLY if the resume says Present/Current/Ongoing. Sort newest first.
7. Qualifications for European readers: write country-specific names in full, e.g.
   "H.S.C" → "Higher Secondary Certificate (HSC)", "S.S.C" → "Secondary School Certificate (SSC)".
   Grades always with their scale: SSC/HSC "GPA 4.67 / 5.00", university "CGPA 3.50 / 4.00".
   Add "eqfLevel": SSC 3, HSC 4, Bachelor 6, Master 7, PhD 8, short trainings "" (empty).
   Leave "fieldOfStudy" empty when it is already part of the qualification title.
8. Phone numbers in international format with readable spacing, e.g. "+880 1846 650807".
9. Leave out personal details Europass does not need and EU employers must not ask for:
   religion, marital status, parents' names, date of birth, nationality, photo.
10. If information Europass needs is missing, write a clear placeholder in square brackets, for example
   "[Add your phone number]", "[Add your English CEFR level, e.g. B2]", "[Add start date MM/YYYY]".
   Use "" (empty string) for optional fields like linkedin/github/website/grade when not present.
11. Address EVERY "improve" tip listed below, and add one entry in "changes" for each fix
   (category = the tip's category). Also list other important rewrites you made.
12. Write in clear, professional English.

Target job:
- Company: ${companyName || "Not specified"}
- Job title: ${jobTitle}
- Job description:
"""
${jobDescription}
"""

Feedback from the previous analysis (overall score ${feedback?.overallScore ?? "?"}/100).
"Improve" tips you must address:
${improveTips(feedback)}

Original resume (plain text extracted from the candidate's PDF):
"""
${resumeText.slice(0, MAX_RESUME_CHARS)}
"""`;
}

// ---------------------------------------------------------------------------
// Normalization: guarantees the exact shape the frontend expects, even if the
// model (or a user edit) leaves a field out or sends the wrong type.
// ---------------------------------------------------------------------------
const s = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const arr = (v) => (Array.isArray(v) ? v : []);
const strs = (v) => arr(v).map(s).filter(Boolean);

export function normalizeEuropassCv(cv = {}) {
    const p = cv?.personalInfo ?? {};
    const langs = cv?.languageSkills ?? {};
    return {
        personalInfo: {
            fullName: s(p.fullName), email: s(p.email), phone: s(p.phone), address: s(p.address),
            linkedin: s(p.linkedin), github: s(p.github), website: s(p.website),
        },
        aboutMe: s(cv?.aboutMe),
        workExperience: arr(cv?.workExperience).map((w) => ({
            startDate: s(w?.startDate), endDate: s(w?.endDate), jobTitle: s(w?.jobTitle),
            employer: s(w?.employer), city: s(w?.city), country: s(w?.country),
            responsibilities: strs(w?.responsibilities),
        })),
        education: arr(cv?.education).map((e) => ({
            startDate: s(e?.startDate), endDate: s(e?.endDate), qualification: s(e?.qualification),
            institution: s(e?.institution), city: s(e?.city), country: s(e?.country),
            fieldOfStudy: s(e?.fieldOfStudy), grade: s(e?.grade), eqfLevel: s(e?.eqfLevel),
        })),
        languageSkills: {
            motherTongue: strs(langs.motherTongue),
            otherLanguages: arr(langs.otherLanguages)
                .filter((l) => s(l?.language))
                .map((l) => ({
                    language: s(l.language),
                    ...Object.fromEntries(CEFR_FIELDS.map((f) => [f, s(l[f])])),
                })),
        },
        digitalSkills: strs(cv?.digitalSkills),
        projects: arr(cv?.projects)
            .filter((pr) => s(pr?.name))
            .map((pr) => ({
                name: s(pr.name), description: s(pr.description),
                technologies: strs(pr.technologies), link: s(pr.link),
            })),
        certifications: arr(cv?.certifications)
            .filter((c) => s(c?.name))
            .map((c) => ({ name: s(c.name), issuer: s(c.issuer), date: s(c.date) })),
        communicationSkills: s(cv?.communicationSkills),
        organisationalSkills: s(cv?.organisationalSkills),
        volunteering: strs(cv?.volunteering),
        references: s(cv?.references),
    };
}

export function normalizeImprovement(raw) {
    const changes = arr(raw?.changes)
        .filter((c) => CHANGE_CATEGORIES.includes(c?.category) && s(c?.after))
        .map((c) => ({
            section: s(c.section), category: c.category,
            before: s(c.before), after: s(c.after), reason: s(c.reason),
        }));
    return { europassCv: normalizeEuropassCv(raw?.europassCv), changes };
}

// ---------------------------------------------------------------------------
// Post-check: enforce the Europass rules in code
// ---------------------------------------------------------------------------
const isPlaceholder = (v) => /^\[[^\]]*\]$/.test(v);

// --- Numbers: anything not in the original resume is replaced by a placeholder ---
const NUMBER_RE = /\d+(?:[.,]\d+)*[%+]?/g; // 15, 4.67, 1,200, 15%, 200+
const normNumber = (n) => n.replace(/[%+]$/, "").replace(/,(?=\d{3}\b)/g, "");

export function numbersIn(text) {
    return new Set((text.match(NUMBER_RE) || []).map(normNumber));
}

// Replaces invented numbers outside of [placeholders]. Returns { text, removed[] }.
export function removeInventedNumbers(text, allowed) {
    const removed = [];
    const parts = text.split(/(\[[^\]]*\])/g); // keep existing placeholders untouched
    const out = parts.map((part) => {
        if (/^\[[^\]]*\]$/.test(part)) return part;
        return part.replace(NUMBER_RE, (token) => {
            if (allowed.has(normNumber(token))) return token;
            removed.push(token);
            return token.endsWith("%") ? "[Add a measurable result, e.g. X%]" : "[Add a measurable result]";
        });
    });
    return { text: out.join(""), removed };
}

// --- Dates: everything to MM/YYYY ---
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (m) => String(m).padStart(2, "0");

export function normalizeDate(value) {
    const v = s(value);
    if (!v || isPlaceholder(v)) return v;
    if (/^(current|present|ongoing|now|till date|to date)$/i.test(v)) return "Current";
    const expected = v.match(/^expected[:\s]+(.+)$/i);
    if (expected) {
        const d = normalizeDate(expected[1]);
        return isPlaceholder(d) ? "[Expected graduation date]" : `Expected ${d}`;
    }
    let m;
    if ((m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) return `${pad(m[2])}/${m[3]}`; // DD/MM/YYYY
    if ((m = v.match(/^(\d{4})[/.-](\d{1,2})(?:[/.-]\d{1,2})?$/))) return `${pad(m[2])}/${m[1]}`; // YYYY-MM(-DD)
    if ((m = v.match(/^(\d{1,2})[/.-](\d{4})$/))) return `${pad(m[1])}/${m[2]}`; // M/YYYY
    // "November 30, 2024", "Nov 2024", "30 November 2024"
    if ((m = v.match(/^(?:\d{1,2}(?:st|nd|rd|th)?\s+)?([A-Za-z]{3,})\.?\s*(?:\d{1,2}(?:st|nd|rd|th)?,?\s+)?(\d{4})$/))) {
        const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
        if (month >= 0) return `${pad(month + 1)}/${m[2]}`;
    }
    return v; // "2022" or anything we cannot parse safely stays as it is
}

// --- Qualifications, EQF levels and grades ---
export function expandQualification(q) {
    return s(q)
        .replace(/^H\.?\s*S\.?\s*C\.?(?=[\s:|–-]|$)/i, "Higher Secondary Certificate (HSC)")
        .replace(/^S\.?\s*S\.?\s*C\.?(?=[\s:|–-]|$)/i, "Secondary School Certificate (SSC)")
        .replace(/^(.*?\))\s*[:|]\s*/, "$1 – ");
}

export function eqfLevelFor(qualification) {
    const q = qualification;
    if (/doctor|ph\.?\s?d/i.test(q)) return "8";
    if (/master|\bM\.?\s?Sc\b|\bMBA\b|\bM\.\s?A\.?(?=\s|$)|\bMEng\b/i.test(q)) return "7";
    if (/bachelor|\bB\.?\s?Sc\b|\bBBA\b|\bB\.\s?A\.?(?=\s|$)|\bB\.?\s?Eng\b|\bB\.?\s?Tech\b/i.test(q)) return "6";
    if (/higher secondary|\bHSC\b|A[- ]level/i.test(q)) return "4";
    if (/secondary school certificate|\bSSC\b|O[- ]level/i.test(q)) return "3";
    return ""; // trainings, courses, unknown → no EQF level
}

export function gradeWithScale(grade, eqfLevel) {
    const g = s(grade);
    const m = g.match(/^(?:C?GPA)?\s*:?\s*(\d(?:\.\d{1,2})?)$/i);
    if (!m) return g; // already has a scale ("3.5 / 4.00"), a class ("First class") or is empty
    const n = Number(m[1]);
    if ((eqfLevel === "3" || eqfLevel === "4") && n <= 5) return `GPA ${m[1]} / 5.00`;
    if ((eqfLevel === "6" || eqfLevel === "7") && n <= 4) return `CGPA ${m[1]} / 4.00`;
    return g;
}

const sameText = (a, b) => a.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim().includes(
    b.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim()
);

// "Final Touch, Bangladesh" + city "Khulna" + country "Bangladesh" → "Final Touch"
// (the city and country are shown next to the name anyway)
export function stripPlace(name, city, country) {
    let n = s(name);
    const places = [city, country].map((p) => s(p).toLowerCase()).filter(Boolean);
    let parts;
    while ((parts = n.split(",")).length > 1 && places.includes(parts.at(-1).trim().toLowerCase())) {
        n = parts.slice(0, -1).join(",").trim();
    }
    return n;
}

// --- Phone: readable spacing ---
const COUNTRY_CODES = ["880", "971", "966", "974", "353", "351", "358", "420", "1", "7", "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45", "46", "47", "48", "49", "60", "61", "62", "63", "64", "65", "66", "81", "82", "84", "86", "90", "91", "92", "94", "95", "98"];

export function formatPhone(phone) {
    const p = s(phone);
    const compact = p.replace(/[\s()-]/g, "");
    if (isPlaceholder(p) || !/^\+?\d{9,15}$/.test(compact) || /\s/.test(p)) return p; // placeholder or already spaced
    const digits = compact.replace(/^\+/, "");
    const cc = COUNTRY_CODES.filter((c) => digits.startsWith(c)).sort((a, b) => b.length - a.length)[0];
    if (!cc || !compact.startsWith("+") && !digits.startsWith("880")) return p;
    const rest = digits.slice(cc.length);
    const groups = rest.length === 10 ? [rest.slice(0, 4), rest.slice(4)] : rest.match(/.{1,4}/g);
    return `+${cc} ${groups.join(" ")}`;
}

// Applies all rules. Returns a new { europassCv, changes } (adds a change entry for every removed number).
export function postCheck({ europassCv, changes }, resumeText) {
    const cv = structuredClone(europassCv);
    const allowed = numbersIn(resumeText);
    const added = [];
    const saysCurrent = /\b(present|current|ongoing|till date|to date|running)\b/i.test(resumeText);
    const expectedGrad = resumeText.match(/expected\s+graduation[:\s-]*([A-Za-z]+\.?\s+\d{4}|\d{1,2}[/.-]\d{4})/i);

    // 1. Numbers that are not in the original resume
    const check = (text, section) => {
        const { text: fixed, removed } = removeInventedNumbers(text, allowed);
        if (removed.length) {
            added.push({
                section,
                category: "content",
                before: text,
                after: fixed,
                reason: `Removed ${removed.map((r) => `"${r}"`).join(", ")} — not in your original resume. ` +
                    "Add a real, provable figure or delete the placeholder.",
            });
        }
        return fixed;
    };
    cv.aboutMe = check(cv.aboutMe, "About Me");
    cv.workExperience.forEach((w) => {
        w.responsibilities = w.responsibilities.map((r) => check(r, "Work Experience"));
    });
    cv.projects.forEach((pr) => { pr.description = check(pr.description, "Projects"); });
    cv.communicationSkills = check(cv.communicationSkills, "Communication Skills");
    cv.organisationalSkills = check(cv.organisationalSkills, "Organisational Skills");
    cv.volunteering = cv.volunteering.map((v) => check(v, "Volunteering"));

    // 2. Dates in one format; "Current" only when the resume says so
    cv.workExperience.forEach((w) => {
        w.employer = stripPlace(w.employer, w.city, w.country);
        w.startDate = normalizeDate(w.startDate);
        w.endDate = normalizeDate(w.endDate);
        if (w.endDate === "Current" && !saysCurrent) w.endDate = "[Add end date MM/YYYY]";
    });
    cv.certifications.forEach((c) => { c.date = normalizeDate(c.date); });

    // 3. Education: full qualification names, EQF level, grade scale, no repeated field of study
    cv.education.forEach((e) => {
        e.institution = stripPlace(e.institution, e.city, e.country);
        e.qualification = expandQualification(e.qualification);
        e.eqfLevel = eqfLevelFor(e.qualification);
        e.grade = gradeWithScale(e.grade, e.eqfLevel);
        if (e.fieldOfStudy && sameText(e.qualification, e.fieldOfStudy)) e.fieldOfStudy = "";
        e.startDate = normalizeDate(e.startDate);
        e.endDate = normalizeDate(e.endDate);
        if (e.endDate === "Current") {
            if (["6", "7", "8"].includes(e.eqfLevel)) {
                // An ongoing degree shows the expected graduation date instead of "Current"
                e.endDate = expectedGrad ? `Expected ${normalizeDate(expectedGrad[1])}` : "[Expected graduation date]";
            } else if (!saysCurrent) {
                e.endDate = "[Add end date MM/YYYY]";
            }
        }
    });

    // 4. Phone with readable spacing
    cv.personalInfo.phone = formatPhone(cv.personalInfo.phone);

    return { europassCv: cv, changes: [...changes, ...added] };
}

export async function improveResume(input) {
    const raw = await generateJson({
        prompt: buildImprovePrompt(input),
        schema: EUROPASS_SCHEMA,
        task: "improve the resume",
        temperature: 0.3,
    });
    return postCheck(normalizeImprovement(raw), input.resumeText);
}
