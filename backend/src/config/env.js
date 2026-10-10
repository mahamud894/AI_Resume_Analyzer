// Loads backend/.env and exposes a single, validated config object.
// Every other file imports settings from here instead of reading process.env directly.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend/ folder (two levels up from src/config)
export const BACKEND_ROOT = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(BACKEND_ROOT, ".env"), quiet: true });

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(
        `❌ Missing required environment variables: ${missing.join(", ")}\n` +
            "   Copy backend/.env.example to backend/.env and fill in the values."
    );
    process.exit(1);
}

const config = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    // Comma-separated list is allowed, e.g. "http://localhost:5173,https://myapp.com"
    clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-flash-latest",
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
    uploadDir: path.join(BACKEND_ROOT, "uploads"),
};

config.isProduction = config.nodeEnv === "production";

export default config;
