// app/constants.ts
// App-wide constants shared by the frontend.

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const APP_NAME = 'AI Resume Analyzer';
// Must match MAX_FILE_SIZE_MB in backend/.env (default 10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['application/pdf'];
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  UPLOAD: '/upload',
  RESUME: '/resume',
  WIPE: '/wipe',
} as const;

// Note: the AI prompt (previously `prepareInstructions` here) now lives in the backend,
// in backend/src/services/geminiService.js (`buildPrompt`). It forces Gemini to return the
// `Feedback` shape from types/index.d.ts, which the Summary/ATS/Details components display.
