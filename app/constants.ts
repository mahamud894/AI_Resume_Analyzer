// app/constants.ts

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const APP_NAME = 'AI Resume Analyzer';
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['application/pdf'];
export const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  RESULT: '/result',
  DASHBOARD: '/dashboard',
} as const;

// AI prompt preparation function (used in upload.tsx)
export const prepareInstructions = ({ jobTitle, jobDescription }: { jobTitle: string, jobDescription: string }) => {
  return `You are an expert HR recruiter. Analyze the given resume against the job description.
Job Title: ${jobTitle}
Job Description: ${jobDescription}
Return a JSON object with keys: atsScore, matchingSkills, missingSkills, suggestions, summary.`;
};