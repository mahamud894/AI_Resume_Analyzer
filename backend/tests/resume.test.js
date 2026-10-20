import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Resume from "../src/models/Resume.js";
import { deleteFiles } from "../src/services/fileStorage.js";
import { app, clearDb, countStoredFiles, createUser, FAKE_PDF, request, startDb, stopDb, uploadPdf } from "./helpers.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("POST /api/resume/upload", () => {
    it("requires login", async () => {
        const res = await request(app).post("/api/resume/upload");
        expect(res.status).toBe(401);
    });

    it("accepts a real PDF and hides the internal storage ids", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);

        expect(resume.originalName).toBe("cv.pdf");
        expect(resume.fileUrl).toBe(`/api/resume/${resume.id}/file`);
        expect(resume.fileId).toBeUndefined();
        expect(await countStoredFiles()).toBe(1);
    });

    it("stores the PDF and preview in GridFS and serves back the same bytes", async () => {
        const { auth } = await createUser();
        const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
        const up = await request(app)
            .post("/api/resume/upload")
            .set("Authorization", auth)
            .attach("resume", FAKE_PDF, { filename: "cv.pdf", contentType: "application/pdf" })
            .attach("image", png, { filename: "cv.png", contentType: "image/png" });
        const { id } = up.body.resume;
        expect(await countStoredFiles()).toBe(2);

        const pdf = await request(app).get(`/api/resume/${id}/file`).set("Authorization", auth).buffer(true)
            .parse((res, cb) => { const d = []; res.on("data", (c) => d.push(c)); res.on("end", () => cb(null, Buffer.concat(d))); });
        expect(pdf.status).toBe(200);
        expect(pdf.headers["content-type"]).toBe("application/pdf");
        expect(pdf.headers["content-disposition"]).toContain("cv.pdf");
        expect(Buffer.compare(pdf.body, FAKE_PDF)).toBe(0);

        const img = await request(app).get(`/api/resume/${id}/image`).set("Authorization", auth);
        expect(img.status).toBe(200);
        expect(img.headers["content-type"]).toBe("image/png");
        expect(Buffer.compare(img.body, png)).toBe(0);
    });

    it("rejects a non-PDF file", async () => {
        const { auth } = await createUser();
        const res = await request(app)
            .post("/api/resume/upload")
            .set("Authorization", auth)
            .attach("resume", Buffer.from("hello"), { filename: "notes.txt", contentType: "text/plain" });

        expect(res.status).toBe(400);
    });

    it("rejects a file renamed to .pdf that is not really a PDF", async () => {
        const { auth } = await createUser();
        const res = await request(app)
            .post("/api/resume/upload")
            .set("Authorization", auth)
            .attach("resume", Buffer.from("MZ fake program"), { filename: "virus.pdf", contentType: "application/pdf" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Uploaded file is not a valid PDF");
    });
});

describe("resume ownership", () => {
    it("lists only the logged-in user's resumes", async () => {
        const alice = await createUser();
        const bob = await createUser();
        await uploadPdf(alice.auth);

        const res = await request(app).get("/api/resume").set("Authorization", bob.auth);

        expect(res.status).toBe(200);
        expect(res.body.resumes).toHaveLength(0);
    });

    it("returns 404 when another user opens, downloads or deletes a resume", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const resume = await uploadPdf(alice.auth);

        for (const [method, path] of [
            ["get", `/api/resume/${resume.id}`],
            ["get", `/api/resume/${resume.id}/file`],
            ["delete", `/api/resume/${resume.id}`],
        ]) {
            const res = await request(app)[method](path).set("Authorization", bob.auth);
            expect(res.status, `${method.toUpperCase()} ${path}`).toBe(404);
        }

        // Alice still has her resume
        const own = await request(app).get(`/api/resume/${resume.id}`).set("Authorization", alice.auth);
        expect(own.status).toBe(200);
    });

    it("returns 400 for an invalid id", async () => {
        const { auth } = await createUser();
        const res = await request(app).get("/api/resume/not-an-id").set("Authorization", auth);
        expect(res.status).toBe(400);
    });
});

describe("DELETE /api/resume/:id", () => {
    it("deletes the owner's resume", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);

        const del = await request(app).delete(`/api/resume/${resume.id}`).set("Authorization", auth);
        const after = await request(app).get(`/api/resume/${resume.id}`).set("Authorization", auth);

        expect(del.status).toBe(200);
        expect(await countStoredFiles()).toBe(0); // the PDF is removed from GridFS too
        expect(after.status).toBe(404);
    });
});

describe("DELETE /api/auth/me", () => {
    it("needs the right password", async () => {
        const { auth } = await createUser();
        const res = await request(app).delete("/api/auth/me").set("Authorization", auth).send({ password: "nope" });

        expect(res.status).toBe(400);
        expect((await request(app).get("/api/auth/me").set("Authorization", auth)).status).toBe(200);
    });

    it("deletes the account with its resumes and files, and leaves other users alone", async () => {
        const alice = await createUser();
        const bob = await createUser();
        const aliceResume = await uploadPdf(alice.auth);
        const bobResume = await uploadPdf(bob.auth);
        expect(await countStoredFiles()).toBe(2);

        const res = await request(app)
            .delete("/api/auth/me")
            .set("Authorization", alice.auth)
            .send({ password: "secret123" });

        expect(res.status).toBe(200);
        expect((await request(app).get("/api/auth/me").set("Authorization", alice.auth)).status).toBe(401);
        expect(await Resume.findById(aliceResume.id)).toBeNull();
        expect(await countStoredFiles()).toBe(1); // only Bob's file is left

        const bobView = await request(app).get(`/api/resume/${bobResume.id}`).set("Authorization", bob.auth);
        expect(bobView.status).toBe(200);
    });
});

describe("missing stored files", () => {
    it("answers a JSON 404 when the PDF is gone from storage", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);
        const stored = await Resume.findById(resume.id);
        await deleteFiles(stored.fileId);

        const res = await request(app).get(`/api/resume/${resume.id}/file`).set("Authorization", auth);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("File not found");
        expect(res.headers["content-type"]).toMatch(/json/);
    });
});
