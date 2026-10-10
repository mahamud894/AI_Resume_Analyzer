// Seeds MongoDB with one demo user, one resume and one analysis.
//
// Run from the backend folder (it uses the backend's .env and node_modules):
//     cd backend
//     npm run seed
//
// Then log in on the website with:  demo@resumind.dev / Demo@1234
// Running it again is safe: the old demo user and their data are replaced.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "../backend/node_modules/bcryptjs/index.js";
import config from "../backend/src/config/env.js";
import { connectDB, disconnectDB } from "../backend/src/config/db.js";
import Analysis from "../backend/src/models/Analysis.js";
import Resume from "../backend/src/models/Resume.js";
import User from "../backend/src/models/User.js";
import { removeFiles, toStoredPath } from "../backend/src/utils/files.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await fs.readFile(path.join(__dirname, "sample-data.json"), "utf8"));

// Builds a tiny but valid one-page PDF containing the given lines of text,
// so the seeded resume can be opened and analyzed like a real upload.
function buildSamplePdf(lines) {
    const escape = (s) => s.replace(/[\\()]/g, (c) => "\\" + c);
    const text = lines
        .map((line, i) => `BT /F1 ${i === 0 ? 18 : 11} Tf 60 ${760 - i * 20} Td (${escape(line)}) Tj ET`)
        .join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = objects.map((obj, i) => {
        const offset = Buffer.byteLength(pdf);
        pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
        return offset;
    });
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(pdf);
}

const RESUME_LINES = [
    "Demo Student - Junior Frontend Developer",
    "Email: demo@resumind.dev | Khulna, Bangladesh | github.com/demo-student",
    "",
    "EDUCATION",
    "B.Sc. in Computer Science and Engineering - Northern University of Business and Technology Khulna",
    "",
    "SKILLS",
    "React, TypeScript, JavaScript, Tailwind CSS, Node.js, Express, MongoDB, Git",
    "",
    "PROJECTS",
    "AI Resume Analyzer - React + Express + MongoDB app that scores resumes with Google Gemini.",
    "Built JWT authentication, file uploads with Multer and a responsive Tailwind UI.",
    "",
    "EXPERIENCE",
    "Frontend Intern, Local Software Firm (3 months)",
    "Designed reusable React components and fixed responsive layout bugs.",
];

async function seed() {
    await connectDB();

    // 1. Remove the previous demo user and everything that belongs to them
    const old = await User.findOne({ email: data.user.email });
    if (old) {
        const oldResumes = await Resume.find({ userId: old._id });
        for (const r of oldResumes) await removeFiles(r.filePath, r.imagePath);
        await Analysis.deleteMany({ userId: old._id });
        await Resume.deleteMany({ userId: old._id });
        await old.deleteOne();
        console.log("🧹 Removed previous demo data");
    }

    // 2. User (password is hashed exactly like the register endpoint does)
    const user = await User.create({
        username: data.user.username,
        email: data.user.email,
        passwordHash: await bcrypt.hash(data.user.password, 10),
    });

    // 3. Files on disk: generated PDF + a preview image from the frontend's public folder
    await fs.mkdir(config.uploadDir, { recursive: true });
    const stamp = Date.now();
    const pdfPath = path.join(config.uploadDir, `${stamp}-seed-resume.pdf`);
    const imagePath = path.join(config.uploadDir, `${stamp}-seed-resume.png`);
    const pdfBuffer = buildSamplePdf(RESUME_LINES);
    await fs.writeFile(pdfPath, pdfBuffer);
    await fs.copyFile(
        path.join(__dirname, "..", "frontend", "public", "images", "resume_01.png"),
        imagePath
    );

    // 4. Resume document
    const resume = await Resume.create({
        userId: user._id,
        filePath: toStoredPath(pdfPath),
        imagePath: toStoredPath(imagePath),
        originalName: data.resume.originalName,
        fileSize: pdfBuffer.length,
        uploadDate: new Date(data.resume.uploadDate),
    });

    // 5. Analysis document (createdAt is set explicitly, so we bypass the automatic timestamp)
    const analysis = await Analysis.create({
        ...data.analysis,
        resumeId: resume._id,
        userId: user._id,
        createdAt: new Date(data.analysis.createdAt),
    });

    console.log("🌱 Seed complete:");
    console.log(`   user     ${user.id}  (${data.user.email} / ${data.user.password})`);
    console.log(`   resume   ${resume.id}`);
    console.log(`   analysis ${analysis.id}  (overall score ${analysis.feedback.overallScore})`);
}

try {
    await seed();
} catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
} finally {
    await disconnectDB();
}
