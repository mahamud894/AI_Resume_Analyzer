// app/constants.ts
// App-wide constants shared by the frontend.

export const API_BASE_URL = "https://resumind-api-3kpd.onrender.com";

// OAuth Client ID for "Sign in with Google". Empty = the Google button is hidden (email login still works).
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
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