import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app, clearDb, createUser, request, startDb, stopDb, uploadPdf } from "./helpers.js";

// Never call the real Gemini API or parse a real PDF in tests
const category = { score: 70, tips: [{ type: "good", tip: "Clear layout", explanation: "Easy to scan." }] };
const FEEDBACK = {
    overallScore: 72,
    ATS: { score: 80, tips: [{ type: "improve", tip: "Add more keywords" }] },
    toneAndStyle: category,
    content: category,
    structure: category,
    skills: category,
};

vi.mock("../src/services/geminiService.js", async (importOriginal) => ({
    ...(await importOriginal()),
    analyzeResume: vi.fn(async () => FEEDBACK),
}));
vi.mock("../src/services/pdfService.js", () => ({
    extractPdfText: vi.fn(async () => "Jane Doe. Software engineer with five years of React and Node.js experience."),
}));

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const job = {
    companyName: "Acme",
    jobTitle: "Frontend Developer",
    jobDescription: "We are looking for a React developer with strong TypeScript skills.",
};

describe("POST /api/resume/analyze", () => {
    it("saves the AI feedback and shows it with the resume", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Authorization", auth)
            .send({ resumeId: resume.id, ...job });

        expect(res.status).toBe(201);
        expect(res.body.analysis.feedback.overallScore).toBe(72);

        const { body } = await request(app).get(`/api/resume/${resume.id}`).set("Authorization", auth);
        expect(body.resume.analyses).toHaveLength(1);
        expect(body.resume.analyses[0].jobTitle).toBe("Frontend Developer");
    });

    it("rejects a too-short job description", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Authorization", auth)
            .send({ resumeId: resume.id, ...job, jobDescription: "short" });

        expect(res.status).toBe(400);
    });

    it("does not analyze another user's resume", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const resume = await uploadPdf(alice.auth);

        const res = await request(app)
            .post("/api/resume/analyze")
            .set("Authorization", bob.auth)
            .send({ resumeId: resume.id, ...job });

        expect(res.status).toBe(404);
    });
});

describe("AI rate limit", () => {
    it("allows 15 AI requests per user per hour, then answers 429", async () => {
        const alice = await createUser();
        const resume = await uploadPdf(alice.auth);
        const analyze = (auth) =>
            request(app).post("/api/resume/analyze").set("Authorization", auth).send({ resumeId: resume.id, ...job });

        for (let i = 0; i < 15; i++) {
            expect((await analyze(alice.auth)).status).toBe(201);
        }
        const blocked = await analyze(alice.auth);
        expect(blocked.status).toBe(429);
        expect(blocked.body.message).toMatch(/Too many AI requests/);

        // The limit is per user: someone else is not blocked by Alice
        const bob = await createUser();
        const bobResume = await uploadPdf(bob.auth);
        const bobRes = await request(app)
            .post("/api/resume/analyze")
            .set("Authorization", bob.auth)
            .send({ resumeId: bobResume.id, ...job });
        expect(bobRes.status).toBe(201);
    });
});
