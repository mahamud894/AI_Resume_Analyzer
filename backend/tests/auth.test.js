import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app, clearDb, request, startDb, stopDb } from "./helpers.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const alice = { username: "alice", email: "alice@test.com", password: "secret123" };

describe("POST /api/auth/register", () => {
    it("creates a user and returns a token without the password hash", async () => {
        const res = await request(app).post("/api/auth/register").send(alice);

        expect(res.status).toBe(201);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body.user).toMatchObject({ username: "alice", email: "alice@test.com" });
        expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("rejects a duplicate email with 409", async () => {
        await request(app).post("/api/auth/register").send(alice);
        const res = await request(app)
            .post("/api/auth/register")
            .send({ ...alice, username: "alice2" });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Email is already registered");
    });

    it("rejects invalid input with 400", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ username: "a", email: "not-an-email", password: "123" });

        expect(res.status).toBe(400);
        expect(res.body.details.length).toBeGreaterThan(0);
    });
});

describe("POST /api/auth/login", () => {
    beforeEach(() => request(app).post("/api/auth/register").send(alice));

    it("logs in with the right password", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: alice.email, password: alice.password });

        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
    });

    it("gives the same 401 message for a wrong password and an unknown email", async () => {
        const wrongPassword = await request(app)
            .post("/api/auth/login")
            .send({ email: alice.email, password: "wrong-password" });
        const unknownEmail = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@test.com", password: "secret123" });

        expect(wrongPassword.status).toBe(401);
        expect(unknownEmail.status).toBe(401);
        expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });
});

describe("GET /api/auth/me", () => {
    it("returns 401 without a token", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    it("returns 401 for a forged token", async () => {
        const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer abc.def.ghi");
        expect(res.status).toBe(401);
    });

    it("returns the logged-in user for a valid token", async () => {
        const { body } = await request(app).post("/api/auth/register").send(alice);
        const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${body.token}`);

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(alice.email);
    });
});

describe("PUT /api/auth/password", () => {
    it("rejects a wrong current password with 400 (not 401, which would log the user out)", async () => {
        const { body } = await request(app).post("/api/auth/register").send(alice);
        const res = await request(app)
            .put("/api/auth/password")
            .set("Authorization", `Bearer ${body.token}`)
            .send({ currentPassword: "wrong-password", newPassword: "newsecret456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Current password is incorrect");
    });

    it("changes the password, returns a working token and logs out older sessions", async () => {
        const { body } = await request(app).post("/api/auth/register").send(alice);
        const oldToken = body.token;
        // JWT iat has 1-second precision: make sure the old token is from an earlier second
        await new Promise((resolve) => setTimeout(resolve, 1100));

        const res = await request(app)
            .put("/api/auth/password")
            .set("Authorization", `Bearer ${oldToken}`)
            .send({ currentPassword: alice.password, newPassword: "newsecret456" });
        expect(res.status).toBe(200);

        const withNew = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${res.body.token}`);
        const withOld = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${oldToken}`);
        expect(withNew.status).toBe(200);
        expect(withOld.status).toBe(401);

        const oldLogin = await request(app).post("/api/auth/login").send({ email: alice.email, password: alice.password });
        const newLogin = await request(app).post("/api/auth/login").send({ email: alice.email, password: "newsecret456" });
        expect(oldLogin.status).toBe(401);
        expect(newLogin.status).toBe(200);
    });
});
