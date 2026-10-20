// Shared helpers: an in-memory MongoDB per test file and quick ways to create users / uploads.
import fs from "node:fs/promises";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";
import config from "../src/config/env.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

let mongo;
let filesBefore;

export async function startDb() {
    mongo = await MongoMemoryServer.create();
    await connectDB(mongo.getUri());
    filesBefore = new Set(await fs.readdir(config.uploadDir));
}

export async function stopDb() {
    await disconnectDB();
    await mongo.stop();
    // Remove any upload a test left behind in backend/uploads
    for (const name of await fs.readdir(config.uploadDir)) {
        if (!filesBefore.has(name)) await fs.rm(`${config.uploadDir}/${name}`, { force: true });
    }
}

export async function clearDb() {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let counter = 0;

// Registers a fresh user and returns { token, user, auth } where auth is the Authorization header value
export async function createUser() {
    counter += 1;
    const res = await request(app)
        .post("/api/auth/register")
        .send({ username: `user${counter}`, email: `user${counter}@test.com`, password: "secret123" });
    return { ...res.body, auth: `Bearer ${res.body.token}` };
}

// The server only checks that the file starts with "%PDF-", so this is enough to pass validation
export const FAKE_PDF = Buffer.from("%PDF-1.4\n%fake test resume\n%%EOF\n");

export async function uploadPdf(auth) {
    const res = await request(app)
        .post("/api/resume/upload")
        .set("Authorization", auth)
        .attach("resume", FAKE_PDF, { filename: "cv.pdf", contentType: "application/pdf" });
    return res.body.resume;
}

export { app, request };
