// Builds the Express application (middleware + routes). server.js starts it.
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();

// Security headers. "cross-origin" lets the frontend (another port) load the PDF/image responses.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Only our frontend is allowed to call the API from a browser
app.use(
    cors({
        origin: config.clientUrls,
        methods: ["GET", "POST", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "1mb" }));
if (!config.isProduction) app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
