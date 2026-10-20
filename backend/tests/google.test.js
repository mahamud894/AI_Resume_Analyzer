import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import config from "../src/config/env.js";
import User from "../src/models/User.js";
import { app, clearDb, request, startDb, stopDb, uploadPdf } from "./helpers.js";

// Replace Google's token check with a fake: the test decides what the "verified" token says.
// The credential string is used as a key into `googleAccounts`.
const googleAccounts = {};
vi.mock("google-auth-library", () => ({
    OAuth2Client: class {
        async verifyIdToken({ idToken, audience }) {
            const payload = googleAccounts[idToken];
            if (!payload || audience !== "test-client-id.apps.googleusercontent.com") throw new Error("Invalid token");
            return { getPayload: () => payload };
        }
    },
}));

const CREDENTIAL = "valid-google-credential-xyz";
const google = (credential = CREDENTIAL) => request(app).post("/api/auth/google").send({ credential });

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
    await clearDb();
    config.googleClientId = "test-client-id.apps.googleusercontent.com";
    for (const key of Object.keys(googleAccounts)) delete googleAccounts[key];
    googleAccounts[CREDENTIAL] = {
        sub: "google-123",
        email: "Rahim.Uddin@gmail.com",
        email_verified: true,
        name: "Rahim Uddin",
    };
});

describe("POST /api/auth/google", () => {
    it("creates a new account the first time and logs into the same one afterwards", async () => {
        const first = await google();
        expect(first.status).toBe(201);
        expect(first.body.user).toMatchObject({ username: "rahim_uddin", email: "rahim.uddin@gmail.com", hasPassword: false });
        expect(first.body.user.googleId).toBeUndefined(); // never sent to the browser

        const again = await google();
        expect(again.status).toBe(200);
        expect(again.body.user.id).toBe(first.body.user.id);
        expect(await User.countDocuments()).toBe(1);

        const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${again.body.token}`);
        expect(me.status).toBe(200);
    });

    it("links Google to an existing email/password account instead of creating a duplicate", async () => {
        const reg = await request(app)
            .post("/api/auth/register")
            .send({ username: "rahim", email: "rahim.uddin@gmail.com", password: "secret123" });

        const res = await google();
        expect(res.status).toBe(200);
        expect(res.body.user.id).toBe(reg.body.user.id);
        expect(res.body.user.hasPassword).toBe(true);

        // Both ways of logging in still work
        const pw = await request(app).post("/api/auth/login").send({ email: "rahim.uddin@gmail.com", password: "secret123" });
        expect(pw.status).toBe(200);
    });

    it("picks a free username when the name is taken", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ username: "rahim_uddin", email: "other@test.com", password: "secret123" });

        const res = await google();
        expect(res.status).toBe(201);
        expect(res.body.user.username).toMatch(/^rahim_uddin_\d{4}$/);
    });

    it("rejects invalid tokens and unverified emails", async () => {
        expect((await google("forged-or-expired-credential")).status).toBe(401);

        googleAccounts[CREDENTIAL].email_verified = false;
        const res = await google();
        expect(res.status).toBe(401);
        expect(await User.countDocuments()).toBe(0);
    });

    it("answers 503 when GOOGLE_CLIENT_ID is not set", async () => {
        config.googleClientId = "";
        expect((await google()).status).toBe(503);
    });
});

describe("Google-only accounts (no password)", () => {
    it("cannot log in with a password and is told to use Google", async () => {
        await google();
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "rahim.uddin@gmail.com", password: "anything" });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Google/);
    });

    it("can set a first password without a current one, then log in with it", async () => {
        const { body } = await google();
        const res = await request(app)
            .put("/api/auth/password")
            .set("Authorization", `Bearer ${body.token}`)
            .send({ newPassword: "brand-new-pass" });

        expect(res.status).toBe(200);
        expect(res.body.user.hasPassword).toBe(true);
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email: "rahim.uddin@gmail.com", password: "brand-new-pass" });
        expect(login.status).toBe(200);
    });

    it("deletes the account only after the email is typed to confirm", async () => {
        const { body } = await google();
        const auth = `Bearer ${body.token}`;
        await uploadPdf(auth);

        const wrong = await request(app).delete("/api/auth/me").set("Authorization", auth).send({ confirmEmail: "nope@x.com" });
        expect(wrong.status).toBe(400);

        const ok = await request(app)
            .delete("/api/auth/me")
            .set("Authorization", auth)
            .send({ confirmEmail: "Rahim.Uddin@gmail.com" });
        expect(ok.status).toBe(200);
        expect(await User.countDocuments()).toBe(0);
    });
});

describe("password accounts", () => {
    it("still need the current password to change it (missing → 400, not a crash)", async () => {
        const reg = await request(app)
            .post("/api/auth/register")
            .send({ username: "karim", email: "karim@test.com", password: "secret123" });
        const res = await request(app)
            .put("/api/auth/password")
            .set("Authorization", `Bearer ${reg.body.token}`)
            .send({ newPassword: "newsecret456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Current password is incorrect");
    });
});
