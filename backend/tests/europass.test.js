import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeResume } from "../src/services/geminiService.js";
import { app, clearDb, createUser, request, startDb, stopDb, uploadPdf } from "./helpers.js";

// No real Gemini calls and no real PDF parsing in tests.
const feedback = (overall) => {
    const category = { score: overall, tips: [{ type: "improve", tip: "Add numbers", explanation: "Quantify results." }] };
    return {
        overallScore: overall,
        ATS: { score: overall, tips: [{ type: "improve", tip: "Add more keywords" }] },
        toneAndStyle: category, content: category, structure: category, skills: category,
    };
};

vi.mock("../src/services/geminiService.js", async (importOriginal) => ({
    ...(await importOriginal()),
    analyzeResume: vi.fn(async () => feedback(60)),
}));
vi.mock("../src/services/pdfService.js", () => ({
    extractPdfText: vi.fn(async () => "Jane Doe. Frontend developer with three years of React and TypeScript experience."),
}));

const CV = {
    personalInfo: { fullName: "Jane Doe", email: "jane@test.com", phone: "[Add your phone]", address: "Khulna, Bangladesh" },
    aboutMe: "Frontend developer focused on React and TypeScript.",
    workExperience: [{
        startDate: "01/2023", endDate: "Current", jobTitle: "Frontend Developer", employer: "Acme",
        city: "Khulna", country: "Bangladesh", responsibilities: ["Built React interfaces", "Wrote TypeScript components"],
    }],
    education: [{ startDate: "2019", endDate: "2023", qualification: "Bachelor of Science (B.Sc.) in CSE", institution: "NUBT", eqfLevel: "6" }],
    languageSkills: { motherTongue: ["Bengali"], otherLanguages: [] },
    digitalSkills: ["Front-end: React, TypeScript"],
};

vi.mock("../src/services/europassService.js", async (importOriginal) => ({
    ...(await importOriginal()),
    improveResume: vi.fn(async () => ({
        europassCv: CV,
        changes: [{ section: "Work Experience", category: "content", before: "worked on UI", after: "Built React interfaces", reason: "Stronger verb" }],
    })),
}));

// Real assembleLetter (header, salutation, sign-off), only the AI paragraphs are fixed
vi.mock("../src/services/coverLetterService.js", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        generateCoverLetter: vi.fn(async ({ cv, inputs, companyName, jobTitle }) =>
            original.assembleLetter({
                raw: { opening: "Opening paragraph.", body: ["Body one.", "Body two."], closing: "Closing paragraph.", highlights: [] },
                cv, inputs, companyName, jobTitle,
            })),
    };
});

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
    await clearDb();
    vi.mocked(analyzeResume).mockClear();
});

const job = {
    companyName: "Acme",
    jobTitle: "Frontend Developer",
    jobDescription: "We are looking for a React developer with strong TypeScript skills.",
};

// A user with one uploaded and analyzed resume
async function analyzedResume() {
    const user = await createUser();
    const resume = await uploadPdf(user.auth);
    const { body } = await request(app)
        .post("/api/resume/analyze")
        .set("Authorization", user.auth)
        .send({ resumeId: resume.id, ...job });
    return { ...user, resume, analysisId: body.analysis.id };
}

const improve = (auth, analysisId) =>
    request(app).post(`/api/resume/analysis/${analysisId}/improve`).set("Authorization", auth);

describe("Europass CV (improve)", () => {
    it("creates the improved CV with its change report", async () => {
        const { auth, analysisId } = await analyzedResume();

        const res = await improve(auth, analysisId);
        expect(res.status).toBe(201);
        expect(res.body.improved.europassCv.personalInfo.fullName).toBe("Jane Doe");
        expect(res.body.improved.changes).toHaveLength(1);
        expect(res.body.improved.afterFeedback).toBeNull();

        const saved = await request(app).get(`/api/resume/analysis/${analysisId}/improved`).set("Authorization", auth);
        expect(saved.status).toBe(200);
        expect(saved.body.improved.id).toBe(res.body.improved.id);
    });

    it("returns 404 before an improved CV exists", async () => {
        const { auth, analysisId } = await analyzedResume();
        const res = await request(app).get(`/api/resume/analysis/${analysisId}/improved`).set("Authorization", auth);
        expect(res.status).toBe(404);
    });

    it("saves inline edits and can reset to the AI version", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);

        const edited = { ...CV, aboutMe: "My own words." };
        const save = await request(app)
            .put(`/api/resume/analysis/${analysisId}/improved`)
            .set("Authorization", auth)
            .send({ europassCv: edited });
        expect(save.status).toBe(200);
        expect(save.body.improved.editedCv.aboutMe).toBe("My own words.");
        expect(save.body.improved.europassCv.aboutMe).toBe(CV.aboutMe); // AI original kept

        const reset = await request(app)
            .put(`/api/resume/analysis/${analysisId}/improved`)
            .set("Authorization", auth)
            .send({ europassCv: null });
        expect(reset.body.improved.editedCv).toBeNull();
    });

    it("does not let another user see or change someone's improved CV", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);
        const other = await createUser();

        expect((await request(app).get(`/api/resume/analysis/${analysisId}/improved`).set("Authorization", other.auth)).status).toBe(404);
        expect((await improve(other.auth, analysisId)).status).toBe(404);
    });
});

describe("Before / After score", () => {
    it("scores the improved CV against the same job and shows it with the analysis", async () => {
        const { auth, analysisId, resume } = await analyzedResume();
        await improve(auth, analysisId);
        vi.mocked(analyzeResume).mockResolvedValueOnce(feedback(84));

        const res = await request(app)
            .post(`/api/resume/analysis/${analysisId}/improved/score`)
            .set("Authorization", auth);
        expect(res.status).toBe(200);
        expect(res.body.improved.afterFeedback.overallScore).toBe(84);
        expect(res.body.improved.scoredAt).toBeTruthy();

        // The CV text is sent without placeholders, for the same job
        const input = vi.mocked(analyzeResume).mock.calls.at(-1)[0];
        expect(input.jobTitle).toBe(job.jobTitle);
        expect(input.resumeText).toContain("Built React interfaces");
        expect(input.resumeText).not.toContain("[Add your phone]");

        // The dashboard / result page get the after score with each analysis
        const { body } = await request(app).get(`/api/resume/${resume.id}`).set("Authorization", auth);
        expect(body.resume.analyses[0].improved.afterFeedback.overallScore).toBe(84);
    });

    it("needs an improved CV first", async () => {
        const { auth, analysisId } = await analyzedResume();
        const res = await request(app).post(`/api/resume/analysis/${analysisId}/improved/score`).set("Authorization", auth);
        expect(res.status).toBe(404);
    });

    it("starts unscored again when the CV is regenerated", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);
        vi.mocked(analyzeResume).mockResolvedValueOnce(feedback(84));
        await request(app).post(`/api/resume/analysis/${analysisId}/improved/score`).set("Authorization", auth);

        const again = await improve(auth, analysisId);
        expect(again.body.improved.afterFeedback).toBeNull();
    });
});

describe("Cover letter", () => {
    const create = (auth, analysisId, body = {}) =>
        request(app).post(`/api/resume/analysis/${analysisId}/cover-letter`).set("Authorization", auth).send(body);

    it("needs the improved CV first", async () => {
        const { auth, analysisId } = await analyzedResume();
        const res = await create(auth, analysisId, { tone: "formal" });
        expect(res.status).toBe(400);
    });

    it("writes a letter from the improved CV with the right salutation and sign-off", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);

        const anonymous = await create(auth, analysisId, { tone: "formal" });
        expect(anonymous.status).toBe(201);
        expect(anonymous.body.coverLetter.letter.sender.fullName).toBe("Jane Doe");
        expect(anonymous.body.coverLetter.letter.subject).toBe("Application for Frontend Developer Position");
        expect(anonymous.body.coverLetter.letter.salutation).toBe("Dear Hiring Manager,");
        expect(anonymous.body.coverLetter.letter.signOff).toBe("Kind regards,");

        const named = await create(auth, analysisId, { tone: "modern", hiringManagerName: "Ms. Sarah Khan" });
        expect(named.body.coverLetter.letter.signOff).toBe("Yours sincerely,");
        expect(named.body.coverLetter.inputs.tone).toBe("modern");
        expect(named.body.coverLetter.id).toBe(anonymous.body.coverLetter.id); // regenerated, not duplicated
    });

    it("rejects an unknown tone", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);
        const res = await create(auth, analysisId, { tone: "funny" });
        expect(res.status).toBe(400);
    });

    it("saves the user's edited text and resets it with an empty string", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);
        await create(auth, analysisId, { tone: "formal" });
        const put = (editedText) =>
            request(app).put(`/api/resume/analysis/${analysisId}/cover-letter`).set("Authorization", auth).send({ editedText });

        expect((await put("My own letter.")).body.coverLetter.editedText).toBe("My own letter.");
        expect((await put("   ")).body.coverLetter.editedText).toBeNull();
    });

    it("keeps letters private", async () => {
        const { auth, analysisId } = await analyzedResume();
        await improve(auth, analysisId);
        await create(auth, analysisId, { tone: "formal" });
        const other = await createUser();

        const res = await request(app).get(`/api/resume/analysis/${analysisId}/cover-letter`).set("Authorization", other.auth);
        expect(res.status).toBe(404);
    });
});

describe("Password rules", () => {
    it("rejects passwords shorter than 8 characters", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ username: "shorty", email: "shorty@test.com", password: "1234567" });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/8-72/);
    });
});
