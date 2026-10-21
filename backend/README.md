# Resumind Backend — REST API

Node.js + Express 5 API for the AI Resume Analyzer (CSE4204-8A-T05).
It handles authentication (bcrypt + JWT), resume uploads (Multer), PDF text extraction (pdf-parse),
AI analysis (Google Gemini, JSON mode) and persistence (MongoDB Atlas via Mongoose).

```
React frontend  ──HTTP/JSON + JWT──▶  Express API  ──Mongoose──▶  MongoDB Atlas
                                          │
                                          ├──pdf-parse──▶ resume text
                                          └──@google/genai──▶ Gemini (structured JSON feedback)
```

---

## 1. Folder structure

```text
backend/
├── server.js                  # Entry point: connect to MongoDB, start HTTP server
├── src/
│   ├── app.js                 # Express app: security middleware, routes, error handler
│   ├── config/
│   │   ├── env.js             # Loads + validates .env → one `config` object
│   │   └── db.js              # MongoDB connect / disconnect
│   ├── models/                # Mongoose schemas (match the ERD)
│   │   ├── User.js
│   │   ├── Resume.js
│   │   ├── Analysis.js
│   │   ├── ImprovedResume.js  # Europass version of a resume (1 per analysis)
│   │   └── CoverLetter.js     # Cover letter (1 per improved resume) — ERD cover_letter_text
│   ├── controllers/           # Request handlers (the "what happens" logic)
│   │   ├── authController.js
│   │   ├── resumeController.js
│   │   ├── improveController.js  # "Improve My Resume (Europass)"
│   │   └── coverLetterController.js  # "Generate Cover Letter" + save edits
│   ├── routes/                # URL → middleware → controller wiring
│   │   ├── authRoutes.js
│   │   └── resumeRoutes.js
│   ├── middleware/
│   │   ├── auth.js            # requireAuth: verifies the JWT, sets req.user
│   │   ├── upload.js          # Multer: PDF-only, size limit, random file names
│   │   ├── validate.js        # express-validator rules for every input
│   │   └── errorHandler.js    # 404 + central JSON error handler
│   ├── services/
│   │   ├── pdfService.js      # PDF → plain text
│   │   ├── geminiService.js   # Shared Gemini JSON-mode call with retries + analysis prompt/schema
│   │   ├── europassService.js # Europass CV schema, "never invent" prompt, normalization
│   │   └── coverLetterService.js # Letter prompt/schema, fixed header/salutation rules, word-count retry
│   └── utils/
│       ├── ApiError.js        # Error with an HTTP status code
│       ├── token.js           # sign / verify JWT
├── tests/                     # Vitest + Supertest API tests (in-memory MongoDB, Gemini mocked)
├── scripts/
│   └── migrate-uploads-to-gridfs.js  # one-time move of old backend/uploads/ files into GridFS
├── .env.example               # Template for your .env
├── Dockerfile                 # Production image (used by ../docker-compose.yml)
└── package.json
```

---

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
# edit .env (see table below)
npm run dev                 # starts on http://localhost:5000 and restarts when src/, server.js or .env change
```

| Script          | What it does                                             |
|-----------------|----------------------------------------------------------|
| `npm run dev`   | Start with auto-restart (`node --watch-path`, watches only `src/`, `server.js`, `.env` — not `node_modules`) |
| `npm start`     | Start normally (production)                              |
| `npm run seed`  | Insert the demo user + resume + analysis (`../database/seed.js`) |
| `npm test`      | Run the API tests once. They use a temporary in-memory MongoDB and a mocked Gemini, so no `.env`, Atlas or API quota is needed (the first run downloads MongoDB) |
| `npm run test:watch` | Re-run the tests whenever a file changes                 |

### Environment variables (`backend/.env`)

| Variable           | Required | Example                                   | Description                              |
|--------------------|----------|-------------------------------------------|------------------------------------------|
| `MONGO_URI`        | ✅       | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/resumind?retryWrites=true&w=majority` | Atlas connection string |
| `JWT_SECRET`       | ✅       | 96 random hex characters                  | Secret used to sign login tokens         |
| `GEMINI_API_KEY`   | for analyze | `AIza...`                              | Free key from Google AI Studio           |
| `PORT`             |          | `5000`                                    | API port                                 |
| `CLIENT_URL`       |          | `http://localhost:5173`                   | Frontend origin allowed by CORS (comma-separated) |
| `JWT_EXPIRES_IN`   |          | `7d`                                      | Token lifetime                           |
| `GEMINI_MODEL`     |          | `gemini-flash-latest`                     | Gemini model name                        |
| `MAX_FILE_SIZE_MB` |          | `10`                                      | Upload size limit                        |

The server refuses to start without `MONGO_URI` and `JWT_SECRET`. Without `GEMINI_API_KEY` it starts,
but `POST /api/resume/analyze` answers `503`.

---

## 3. API documentation

Base URL: `http://localhost:5000/api`

**Authentication:** routes marked 🔒 need the header `Authorization: Bearer <token>`, where `<token>` is
the JWT returned by register/login. Tokens expire after 7 days.

**Errors** always look like this (with an HTTP status 4xx/5xx):

```json
{ "message": "Job title is required (max 100 characters)",
  "details": [ { "field": "jobTitle", "message": "Job title is required (max 100 characters)" } ] }
```

### 3.1 Summary

| Method | Route                     | Auth | Request body                                              | Success |
|--------|---------------------------|------|-----------------------------------------------------------|---------|
| GET    | `/health`                 |      | –                                                         | 200 `{ status, time }` |
| POST   | `/auth/register`          |      | JSON `{ username, email, password }`                      | 201 `{ token, user }` |
| POST   | `/auth/login`             |      | JSON `{ email, password }`                                | 200 `{ token, user }` |
| POST   | `/auth/google`            |      | JSON `{ credential }` (Google ID token)                   | 201 new / 200 existing `{ token, user }` · 401 invalid or unverified · 503 `GOOGLE_CLIENT_ID` not set |
| GET    | `/auth/me`                | 🔒   | –                                                         | 200 `{ user }` |
| PUT    | `/auth/password`          | 🔒   | JSON `{ currentPassword, newPassword }` (Google-only: `{ newPassword }`) | 200 `{ token, user }` · 400 wrong current password |
| DELETE | `/auth/me`                | 🔒   | JSON `{ password }` (Google-only: `{ confirmEmail }`)     | 200 `{ message }` · 400 wrong password |
| POST   | `/resume/upload`          | 🔒   | `multipart/form-data`: `resume` (PDF, required), `image` (PNG/JPEG, optional) | 201 `{ resume }` |
| POST   | `/resume/analyze`         | 🔒   | JSON `{ resumeId, companyName?, jobTitle, jobDescription }` | 201 `{ analysis }` |
| GET    | `/resume`                 | 🔒   | –                                                         | 200 `{ resumes: [...] }` (newest first, each with `analyses`) |
| GET    | `/resume/:id`             | 🔒   | –                                                         | 200 `{ resume }` |
| GET    | `/resume/:id/file`        | 🔒   | –                                                         | 200 PDF bytes (`application/pdf`) |
| GET    | `/resume/:id/image`       | 🔒   | –                                                         | 200 PNG bytes |
| DELETE | `/resume/:id`             | 🔒   | –                                                         | 200 `{ message, id }` |
| POST   | `/resume/analysis/:analysisId/improve`  | 🔒 | –                                     | 201 `{ improved }` (Europass CV + changes; replaces an existing one) |
| GET    | `/resume/analysis/:analysisId/improved` | 🔒 | –                                     | 200 `{ improved }` · 404 if not generated yet |
| PUT    | `/resume/analysis/:analysisId/improved` | 🔒 | JSON `{ europassCv }` (edited CV, ≤ 100 KB) or `{ europassCv: null }` (reset) | 200 `{ improved }` |
| POST   | `/resume/analysis/:analysisId/improved/score` | 🔒 | – | 200 `{ improved }` with `afterFeedback` (the improved CV scored for the same job) · 404 if no improved resume |
| POST   | `/resume/analysis/:analysisId/cover-letter` | 🔒 | JSON `{ hiringManagerName?, companyAddress?, jobSource?, tone? }` | 201 `{ coverLetter }` (replaces an existing one) · 400 if no improved resume |
| GET    | `/resume/analysis/:analysisId/cover-letter` | 🔒 | –                                 | 200 `{ coverLetter }` · 404 if not generated yet |
| PUT    | `/resume/analysis/:analysisId/cover-letter` | 🔒 | JSON `{ editedText }` (≤ 8000 chars; `""` = reset) | 200 `{ coverLetter }` |

### 3.2 Details and examples

#### `POST /api/auth/register`

| Field      | Rules                                                 |
|------------|-------------------------------------------------------|
| `username` | 3–30 chars, letters / numbers / `_` / `.`, unique     |
| `email`    | valid email, unique (stored lowercase)                |
| `password` | 6–72 chars (hashed with bcrypt, never stored in plain text) |

```json
// Request
{ "username": "tanveer", "email": "tanveer@example.com", "password": "secret123" }

// 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "6aca150b1f91ced92f7ef8c0", "username": "tanveer",
            "email": "tanveer@example.com", "createdAt": "2026-10-10T10:35:55.065Z" }
}
```
Errors: `400` invalid input · `409` email/username already used · `429` too many attempts.

#### `POST /api/auth/login`

```json
// Request
{ "email": "tanveer@example.com", "password": "secret123" }
// 200 OK → same shape as register
```
Errors: `400` invalid input · `401` `"Invalid email or password"` · `429` too many attempts (20 per 15 min per IP).

#### `GET /api/auth/me` 🔒

```json
// 200 OK
{ "user": { "id": "6aca150b1f91ced92f7ef8c0", "username": "tanveer", "email": "tanveer@example.com", "createdAt": "..." } }
```
Errors: `401` missing / invalid / expired token.

#### `PUT /api/auth/password` 🔒

Body `{ "currentPassword": "Demo@1234", "newPassword": "NewPass@5678" }` (new password 8-72 characters).
Returns `{ token, user }` like login. The user's `passwordChangedAt` is set, so **every token issued before the
change stops working** (other devices are logged out); the client stores the new token. A wrong current password
returns `400`, not `401`, so the frontend does not log the user out for a typo.

#### `DELETE /api/auth/me` 🔒

Body `{ "password": "Demo@1234" }`. Deletes the user, all of their resumes, analyses, improved resumes,
cover letters and the uploaded files. Wrong password → `400`.

#### `POST /api/resume/upload` 🔒

`multipart/form-data` fields:
- `resume` — **required**, `.pdf` with MIME `application/pdf`, file must really start with `%PDF-`, max 10 MB
- `image` — optional PNG/JPEG preview of page 1 (the frontend renders it with pdf.js)

```json
// 201 Created
{
  "resume": {
    "id": "6aca15131f91ced92f7ef8c2",
    "userId": "6aca150b1f91ced92f7ef8c0",
    "originalName": "my resume.pdf",
    "fileSize": 84213,
    "uploadDate": "2026-10-10T10:36:03.089Z",
    "fileUrl": "/api/resume/6aca15131f91ced92f7ef8c2/file",
    "imageUrl": "/api/resume/6aca15131f91ced92f7ef8c2/image"
  }
}
```
Errors: `400` no file / not a PDF / wrong field · `413` file too large.

#### `POST /api/resume/analyze` 🔒

| Field            | Rules                                  |
|------------------|----------------------------------------|
| `resumeId`       | id of one of **your** resumes          |
| `companyName`    | optional, max 100 chars                |
| `jobTitle`       | required, max 100 chars                |
| `jobDescription` | required, 20–10 000 chars              |

Steps: load the PDF → extract text with pdf-parse → send text + job details to Gemini with
`responseMimeType: "application/json"` and a JSON schema → validate/clamp the result → save an `Analysis`.
If Gemini answers 500/503/504 ("high demand"), the request is retried up to 3 times (after 2 s and 4 s).
Takes ~10–20 seconds.

```json
// Request
{ "resumeId": "6aca15131f91ced92f7ef8c2", "companyName": "Google",
  "jobTitle": "Junior Frontend Developer", "jobDescription": "We need React + TypeScript..." }

// 201 Created
{
  "analysis": {
    "id": "6aca1b2a1f91ced92f7ef8d0",
    "resumeId": "6aca15131f91ced92f7ef8c2",
    "userId": "6aca150b1f91ced92f7ef8c0",
    "companyName": "Google",
    "jobTitle": "Junior Frontend Developer",
    "jobDescription": "We need React + TypeScript...",
    "feedback": {
      "overallScore": 72,
      "ATS":          { "score": 78, "tips": [ { "type": "good", "tip": "Clear section headings" } ] },
      "toneAndStyle": { "score": 75, "tips": [ { "type": "improve", "tip": "Avoid first person", "explanation": "..." } ] },
      "content":      { "score": 65, "tips": [ ... ] },
      "structure":    { "score": 80, "tips": [ ... ] },
      "skills":       { "score": 70, "tips": [ ... ] }
    },
    "createdAt": "2026-10-10T10:40:12.000Z"
  }
}
```
Errors: `400` invalid input · `404` resume not found / not yours · `422` PDF has no readable text (scanned image) ·
`429` Gemini rate limit · `502` Gemini failed · `503` `GEMINI_API_KEY` missing/invalid, or Gemini still busy after 3 automatic retries.

#### `GET /api/resume` 🔒

```json
// 200 OK
{
  "resumes": [
    {
      "id": "6aca15131f91ced92f7ef8c2",
      "originalName": "my resume.pdf",
      "uploadDate": "...",
      "fileUrl": "/api/resume/6aca15131f91ced92f7ef8c2/file",
      "imageUrl": "/api/resume/6aca15131f91ced92f7ef8c2/image",
      "analyses": [ { "id": "...", "companyName": "Google", "jobTitle": "...", "feedback": { ... }, "createdAt": "..." } ]
    }
  ]
}
```
Resumes are sorted newest first; each resume's `analyses` are sorted newest first.

#### `GET /api/resume/:id` 🔒
Same object as one item of the list above. `400` invalid id · `404` not found / not yours.

#### `GET /api/resume/:id/file` and `GET /api/resume/:id/image` 🔒
Return the raw PDF / PNG. Because they need the `Authorization` header, the frontend downloads them
with `fetch`, then shows them using `URL.createObjectURL(blob)`.

#### `DELETE /api/resume/:id` 🔒
Deletes the resume, **all its analyses**, their improved resumes and cover letters, and both stored files (GridFS).
```json
{ "message": "Resume deleted", "id": "6aca15131f91ced92f7ef8c2" }
```

#### `POST /api/resume/analysis/:analysisId/improve` 🔒 — "Improve My Resume (Europass)"

No request body. `analysisId` must be one of **your** analyses (any other id → `404`).

Steps: re-extract the resume text with pdf-parse → send it with the saved feedback (every `"improve"` tip)
and the job title/description to Gemini in JSON mode with a strict `responseJsonSchema` (Europass CV +
change list) → normalize the result → save it. Uses the same 3× retry and error handling as `/analyze`.
Takes ~20–40 seconds. Calling it again **regenerates** and replaces the previous version
(one improved resume per analysis, enforced by a unique index).

Prompt rules: never invent experience, degrees, companies, dates, numbers or skills; keep job titles
**exactly** as in the resume (also in About Me — no "SEO Content Writer" → "SEO Specialist"); only rephrase
with strong action verbs; add job keywords only where the candidate has the skill; all dates `MM/YYYY`;
write country-specific qualifications in full with grade scale and EQF level; leave out religion, marital
status, parents' names and date of birth; put clear placeholders like `"[Add your English CEFR level, e.g. B2]"`
where Europass needs missing information; address every "improve" tip and list each fix in `changes`.

**Post-check (code, after Gemini answers)** — `postCheck()` in `services/europassService.js` enforces the key
rules even if the model ignores the prompt:

| Rule | Example |
|------|---------|
| Numbers not in the original resume → placeholder, and listed in `changes` | "by 40%" → "by [Add a measurable result, e.g. X%]" (a real "15%" is kept) |
| All dates `MM/YYYY` | "30/11/2024", "November 30, 2024" → "11/2024" |
| Ongoing degree → expected graduation | "Current" → "Expected 08/2026" (from "Expected Graduation: August 2026") or "[Expected graduation date]" |
| "Current" only if the resume says Present/Current/Ongoing | otherwise "[Add end date MM/YYYY]" |
| Qualification names in full | "H.S.C" → "Higher Secondary Certificate (HSC)", "S.S.C" → "Secondary School Certificate (SSC)" |
| EQF level | SSC 3, HSC 4, Bachelor 6, Master 7, PhD 8, trainings "" |
| Grade scale | "4.67" → "GPA 4.67 / 5.00"; university → "CGPA x / 4.00" |
| No repeats | field of study inside the degree title; city/country inside the employer name |
| Phone spacing | "+8801846650807" → "+880 1846 650807" |

```json
// 201 Created
{
  "improved": {
    "id": "6acaffd93e58cbeb17864f08",
    "analysisId": "6aca2f8814357dd8c2a26257",
    "resumeId": "6aca2f8814357dd8c2a26256",
    "userId": "6aca2f8814357dd8c2a26255",
    "europassCv": {
      "personalInfo": { "fullName": "Demo Student", "email": "demo@resumind.dev", "phone": "[Add your phone number]",
                        "address": "Khulna, Bangladesh", "linkedin": "", "github": "https://github.com/demo-student", "website": "" },
      "aboutMe": "Junior Frontend Developer with hands-on experience in React, TypeScript and Tailwind CSS…",
      "workExperience": [ { "startDate": "[Add start date MM/YYYY]", "endDate": "[Add end date MM/YYYY]",
                            "jobTitle": "Frontend Intern", "employer": "Local Software Firm", "city": "Khulna",
                            "country": "Bangladesh", "responsibilities": [ "Designed reusable React components…" ] } ],
      "education": [ { "startDate": "…", "endDate": "…", "qualification": "Bachelor of Science (B.Sc.)",
                       "institution": "Northern University of Business and Technology Khulna", "city": "Khulna",
                       "country": "Bangladesh", "fieldOfStudy": "Computer Science and Engineering", "grade": "" } ],
      "languageSkills": { "motherTongue": [ "[Add your mother tongue]" ],
                          "otherLanguages": [ { "language": "[Add a language you speak, e.g. English]", "listening": "[Add level, e.g. B2]",
                                                "reading": "…", "spokenProduction": "…", "spokenInteraction": "…", "writing": "…" } ] },
      "digitalSkills": [ "React", "TypeScript", "Tailwind CSS", "Node.js", "Express", "MongoDB", "Git" ],
      "projects": [ { "name": "AI Resume Analyzer", "description": "…", "technologies": [ "React", "Express" ], "link": "" } ],
      "certifications": [], "communicationSkills": "", "organisationalSkills": "", "volunteering": [],
      "references": "Available upon request"
    },
    "changes": [
      { "section": "About Me", "category": "toneAndStyle", "before": "(missing)",
        "after": "Junior Frontend Developer with hands-on experience…",
        "reason": "Added a summary in implied first person (tone tip: avoid \"I am\")." }
    ],
    "createdAt": "2026-10-11T03:17:45.038Z"
  }
}
```
Errors: `400` invalid id · `401` not logged in · `404` analysis not found / not yours · `422` PDF has no
readable text · `429` Gemini rate limit · `502` Gemini failed · `503` key missing/invalid or model busy after retries.

#### `GET /api/resume/analysis/:analysisId/improved` 🔒
Returns the saved `{ improved }` (same shape as above), or `404 "No improved resume yet for this analysis"`.
`GET /api/resume` and `GET /api/resume/:id` also include `improved: { id, analysisId, createdAt, afterFeedback, scoredAt }` inside each
analysis that has one, so the frontend can choose between "Improve My Resume" and "View Improved Resume".
The improved resume itself includes `coverLetter: { id, improvedResumeId, updatedAt }` when a letter exists.

#### `POST /api/resume/analysis/:analysisId/improved/score` 🔒 — Before / After score
Scores the improved CV (the user's edited version if saved, otherwise the AI version) against the **same job**
with the same prompt as `/analyze`. Placeholders such as `[Add your phone]` are removed first, so only real
content counts. Saves the result as `afterFeedback` (same shape as `analysis.feedback`) and `scoredAt`.
Uses the AI quota (15 AI requests per user per hour). Regenerating the CV resets `afterFeedback` to `null`.
`GET /api/resume` and `GET /api/resume/:id` include `afterFeedback` and `scoredAt` inside `analysis.improved`,
so the result page can draw the score history chart.

#### `PUT /api/resume/analysis/:analysisId/improved` 🔒 — save inline CV edits

The user edits the CV directly on the page. The AI version stays untouched in `europassCv`; the edits are
stored in `editedCv`. The page, the PDF and the cover letter generator all use `editedCv ?? europassCv`.

```json
// Request — the whole CV (same shape as europassCv). Unknown fields are dropped, max 100 KB.
{ "europassCv": { "personalInfo": { "fullName": "Mahamud Hassan", "phone": "+880 1846 650807", … }, "aboutMe": "…", … } }

// Reset to the AI version
{ "europassCv": null }

// 200 OK
{ "improved": { …, "europassCv": { /* AI version */ }, "editedCv": { /* your version or null */ },
                "editedAt": "2026-10-11T09:12:00.000Z" } }
```
Errors: `400` `europassCv` is not an object/null · `404` analysis or improved resume not found / not yours ·
`413` edited CV larger than 100 KB. Regenerating the improved resume discards the edits.

#### `POST /api/resume/analysis/:analysisId/cover-letter` 🔒 — "Generate Cover Letter"

Implements `cover_letter_text` from the original ERD (`CAREER_COPILOT_ASSESSMENT`).

| Field               | Rules                                                                    |
|---------------------|--------------------------------------------------------------------------|
| `hiringManagerName` | optional, ≤ 100 chars. With a title ("Ms. Sarah Rahman") → "Dear Ms. Rahman"; without one → "Dear Sarah Rahman"; empty → "Dear Hiring Manager" |
| `companyAddress`    | optional, ≤ 300 chars (empty → `"[Company address]"` placeholder)       |
| `jobSource`         | optional, ≤ 100 chars, e.g. "LinkedIn" (used in the opening)            |
| `tone`              | `"formal"` (default) or `"modern"`                                       |

Steps: load the saved **ImprovedResume** (`europassCv`) and the analysis (company, job title, description) —
`400 "Generate the improved resume first"` if there is none → Gemini (JSON mode, strict schema) writes only
`opening`, `body[2]`, `closing` and `highlights` → the backend fills in the fixed parts (sender from the CV,
date, recipient, subject `Application for <Job Title> Position`, salutation, sign-off "Yours sincerely" /
"Kind regards", word count) → if the body is outside 250–400 words, Gemini is asked once more to fix the
length → save (replaces any previous letter and its edits). Same retry/error handling as the other AI routes.

Prompt rules: European business letter on one A4 page; no clichés or hype words; opening = position + where
it was found + hook; body 1 = 2–3 achievements taken **only** from the CV that match the job; body 2 = why this
company + value; closing = interview request + attached CV + thanks; never invent experience, numbers, degrees
or company facts — unknown details become placeholders like `"[Mention something specific about Google]"`.

```json
// Request
{ "hiringManagerName": "Ms. Sarah Rahman", "companyAddress": "", "jobSource": "LinkedIn", "tone": "formal" }

// 201 Created
{
  "coverLetter": {
    "id": "6acb0977c1e7433d3537b92f",
    "improvedResumeId": "6acb02ce79dbe54bfe24a21c",
    "analysisId": "6acb02ce79dbe54bfe24a21b",
    "userId": "6acb02ce79dbe54bfe24a219",
    "inputs": { "hiringManagerName": "Ms. Sarah Rahman", "companyAddress": "", "jobSource": "LinkedIn", "tone": "formal" },
    "letter": {
      "sender": { "fullName": "Demo Student", "email": "demo@resumind.dev", "phone": "[Add your phone number]",
                  "address": "Khulna, Bangladesh", "linkedin": "" },
      "date": "11 October 2026",
      "recipient": { "name": "Ms. Sarah Rahman", "title": "Hiring Manager", "company": "Google", "address": "[Company address]" },
      "subject": "Application for Junior Frontend Developer Position",
      "salutation": "Dear Ms. Rahman,",
      "opening": "Discovering the Junior Frontend Developer opening through LinkedIn…",
      "body": [ "During my time as a Frontend Intern at Local Software Firm, I designed reusable React components…",
                "I have long admired Google for [Mention something specific about Google]…" ],
      "closing": "I would welcome the opportunity to discuss… Please find my Europass CV attached…",
      "signOff": "Yours sincerely,",
      "signatureName": "Demo Student",
      "wordCount": 304,
      "highlights": [ { "jobRequirement": "React", "resumeEvidence": "Designed reusable React components…",
                        "cvSection": "Work Experience" } ]
    },
    "editedText": null,
    "createdAt": "2026-10-11T03:58:47.611Z",
    "updatedAt": "2026-10-11T03:58:47.611Z"
  }
}
```
Errors: `400` invalid input / no improved resume yet · `401` · `404` analysis not found / not yours ·
`429` rate limit or daily quota · `502` Gemini failed · `503` key missing/invalid or model busy.

#### `GET /api/resume/analysis/:analysisId/cover-letter` 🔒
Returns the saved `{ coverLetter }` (same shape), or `404 "No cover letter yet for this analysis"`.

#### `PUT /api/resume/analysis/:analysisId/cover-letter` 🔒 — save the user's edits
```json
// Request — the whole letter as plain text, paragraphs separated by blank lines (max 8000 characters)
{ "editedText": "Demo Student\nKhulna, Bangladesh\n…\n\nDear Ms. Rahman,\n\n…" }
// 200 OK → { "coverLetter": { …, "editedText": "Demo Student\n…", "updatedAt": "…" } }
```
An empty string resets to the generated letter (`editedText: null`). Errors: `400` too long / not text ·
`404` no letter yet.

### 3.3 Try it with curl

```bash
# register and keep the token
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
     -d '{"username":"tester","email":"tester@example.com","password":"secret123"}'

TOKEN=<paste token>

curl -X POST http://localhost:5000/api/resume/upload -H "Authorization: Bearer $TOKEN" \
     -F "resume=@./my-resume.pdf;type=application/pdf"

curl -X POST http://localhost:5000/api/resume/analyze -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"resumeId":"<id>","jobTitle":"Frontend Developer","jobDescription":"React, TypeScript, REST APIs, Git"}'
```

---

## 4. Security measures

| Threat                         | Protection                                                                 |
|--------------------------------|----------------------------------------------------------------------------|
| Stolen passwords               | bcrypt hashing (10 salt rounds); hash is `select: false` and never sent to clients |
| Stolen session after a password change | `passwordChangedAt`: tokens issued before the change are rejected with `401` |
| Unauthorized access            | `requireAuth` middleware verifies the JWT on every resume route            |
| Reading other users' data      | Every query filters by `userId = req.user._id`; others get `404`           |
| Password guessing              | `express-rate-limit`: 20 login/register attempts per 15 min per IP         |
| Using up the Gemini quota      | `express-rate-limit`: 15 AI requests (analyze + improve + cover letter) per hour per user → `429` |
| Malicious uploads              | PDF-only (extension + MIME + `%PDF-` magic bytes), 10 MB limit, max 2 files; files stored in MongoDB GridFS, never on the server disk |
| Bad input / NoSQL injection    | `express-validator` on all bodies and ids; Mongoose `strictQuery`          |
| Cross-site requests            | CORS allows only `CLIENT_URL`                                              |
| Common HTTP attacks            | `helmet` security headers; JSON body limited to 1 MB                       |
| Leaking internals              | Central error handler; stack traces only in development                    |
| Leaked secrets                 | All secrets in `.env`, which is git-ignored (`.env.example` is committed)  |
