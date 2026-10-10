// Entry point: connect to MongoDB, then start the HTTP server.
import config from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import app from "./src/app.js";

try {
    await connectDB();
} catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
    console.error("   Check MONGO_URI in backend/.env and your Atlas Network Access (IP allow-list).");
    process.exit(1);
}

app.listen(config.port, () => {
    console.log(`🚀 API running on http://localhost:${config.port}`);
    if (!config.geminiApiKey) {
        console.warn("⚠️  GEMINI_API_KEY is not set — /api/resume/analyze will return 503.");
    }
});
