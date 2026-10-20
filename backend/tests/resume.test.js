import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import config from "../src/config/env.js";
import Resume from "../src/models/Resume.js";
import { app, clearDb, createUser, request, startDb, stopDb, uploadPdf } from "./helpers.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("POST /api/resume/upload", () => {
    it("requires login", async () => {
        const res = await request(app).post("/api/resume/upload");
        expect(res.status).toBe(401);
    });

    it("accepts a real PDF and hides the server file path", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);

        expect(resume.originalName).toBe("cv.pdf");
        expect(resume.fileUrl).toBe(`/api/resume/${resume.id}/file`);
        expect(resume.filePath).toBeUndefined();
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
        const filesBefore = (await fs.readdir(config.uploadDir)).length;

        const res = await request(app)
            .delete("/api/auth/me")
            .set("Authorization", alice.auth)
            .send({ password: "secret123" });

        expect(res.status).toBe(200);
        expect((await request(app).get("/api/auth/me").set("Authorization", alice.auth)).status).toBe(401);
        expect(await Resume.findById(aliceResume.id)).toBeNull();
        expect((await fs.readdir(config.uploadDir)).length).toBe(filesBefore - 1);

        const bobView = await request(app).get(`/api/resume/${bobResume.id}`).set("Authorization", bob.auth);
        expect(bobView.status).toBe(200);
    });
});

describe("missing files on disk", () => {
    it("answers 404 without leaking the server's file path", async () => {
        const { auth } = await createUser();
        const resume = await uploadPdf(auth);
        const stored = await Resume.findById(resume.id);
        await fs.rm(`${config.uploadDir}/${stored.filePath.split("/").pop()}`);

        const res = await request(app).get(`/api/resume/${resume.id}/file`).set("Authorization", auth);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("File not found");
        expect(JSON.stringify(res.body)).not.toMatch(/uploads|ENOENT/);
    });
});
