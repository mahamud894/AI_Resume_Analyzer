// Runs before every test file, before the app is imported.
// Values set here win over backend/.env (dotenv never overrides existing variables),
// so tests never touch the real Atlas database or the real Gemini key.
process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://placeholder"; // replaced by the in-memory server in helpers.js
process.env.JWT_SECRET = "test-secret";
process.env.GEMINI_API_KEY = "test-key";
