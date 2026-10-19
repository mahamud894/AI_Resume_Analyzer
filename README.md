# AI-Powered Resume Analyzer and Career Copilot

A full-stack AI Resume Analyzer. Candidates create an account, upload their resume as a PDF, enter the
company, job title and job description, and receive an AI-generated evaluation: an overall score,
an ATS (Applicant Tracking System) score and detailed tips on tone & style, content, structure and skills.
Every analysis is stored, so users can track all their applications in one dashboard.

![Resumind](frontend/public/readme/hero.webp)

---

## 📋 1. Course & Project Metadata

- **Course Code:** CSE4204 (Mobile Computing Lab)
- **Academic Semester:** Summer 2026
- **Academic Section:** 8A
- **Team Name:** CSE4204-8A-T05
- **Academic Institution:** Northern University of Business and Technology, Khulna
- **Submitted To:** **Md. Riaz Mahmud**, Assistant Professor, Department of Computer Science and Engineering

---

## 👥 2. Team Engineering Roster & Roles

1. **Mahammad Hasan (ID: 11220320828)** — _Team Leader / Frontend Architecture Lead_
   - Boilerplate compilation, global store setup via Zustand, and component logic.
2. **Shanawaz Sakib (ID: 11220320916)** — _Core System Integration Engineer_
   - Puter.js SDK orchestration, AI semantic prompt engineering, and response mapping.
3. **Ashikur Rahman Himel (ID: 11220320833)** — _Database Storage & Quality Controller_
   - File system streams handling, input validations, error-catch routines, and QA.
4. **Rasel Ratul (ID: 11220320827)** — _UI-UX & Tailwind Matrix Designer_
   - High-fidelity interface development using Tailwind CSS v4 layout systems.

---

## 🏗️ 3. System Architecture

```text
┌──────────────────────────┐   HTTPS + JSON    ┌───────────────────────────┐   Mongoose   ┌─────────────────┐
│  Frontend (React 19)     │  Authorization:   │  Backend (Express 5)      │ ───────────▶ │  MongoDB Atlas  │
│  React Router · Tailwind │  Bearer <JWT>     │  REST API · JWT · Multer  │              │ users / resumes │
│  Zustand · pdf.js        │ ────────────────▶ │  pdf-parse · validation   │              │ / analyses      │
│  localhost:5173          │ ◀──────────────── │  localhost:5000           │              └─────────────────┘
└──────────────────────────┘                   │                           │   @google/genai
                                               │                           │ ───────────▶ ┌─────────────────┐
                                               │  uploads/ (PDF + PNG)     │  JSON mode   │  Google Gemini  │
                                               └───────────────────────────┘ ◀─────────── └─────────────────┘
```

**How one analysis works**

1. The user logs in → the backend checks the password with **bcrypt** and returns a **JWT**.
2. On the upload page the browser renders page 1 of the PDF to a PNG preview with **pdf.js**.
3. `POST /api/resume/upload` sends the PDF + preview. **Multer** checks it is a real PDF (≤ 10 MB) and saves it.
4. `POST /api/resume/analyze` → the backend extracts the text with **pdf-parse**, sends it with the job details
   to **Google Gemini** in **JSON mode** (a fixed JSON schema), validates the answer and saves an `Analysis`.
   If Gemini is temporarily busy (HTTP 500/503), the backend retries automatically up to 3 times.
5. The frontend redirects to `/resume/:id`, which shows the preview, the PDF and the feedback.
6. _(Optional)_ **Improve My Resume (Europass)** → `POST /api/resume/analysis/:analysisId/improve` sends the resume
   text, the saved feedback and the job details to Gemini with a strict Europass JSON schema. The result is an
   `ImprovedResume` (Europass CV + "what we improved" report), shown at `/resume/:id/improved/:analysisId`
   and downloadable as an A4 PDF through the browser's print dialog.
7. _(Optional)_ **Generate Cover Letter** → `POST /api/resume/analysis/:analysisId/cover-letter` sends the improved
   Europass CV and the job details to Gemini. The backend fills in the fixed business-letter parts (sender, date,
   recipient, subject, salutation, sign-off) and saves a `CoverLetter`, shown at
   `/resume/:id/improved/:analysisId/cover-letter`, where it can be edited, copied and downloaded as an A4 PDF.

---

## 💻 4. Technology Stack

| Layer    | Technology                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 19, React Router 8 (SSR), TypeScript 5, Tailwind CSS 4, Zustand 5, pdf.js, react-dropzone                                   |
| Backend  | Node.js, Express 5, Mongoose 9, JSON Web Tokens, bcryptjs, Multer, pdf-parse, express-validator, helmet, cors, express-rate-limit |
| Database | MongoDB Atlas (cloud, free M0 cluster)                                                                                            |
| AI       | Google Gemini API (`@google/genai`, structured JSON output)                                                                       |
| Tooling  | Vite, Docker (frontend), npm                                                                                                      |

---

## 📂 5. Repository Structure

```text
AI-Resume-Analyzer/
├── frontend/                   # React web application
│   ├── app/
│   │   ├── components/         # Navbar, FileUploader, ResumeCard, Summary, ATS, Details, Score*,
│   │   │                       # EuropassCv, ImprovementReport, CoverLetterSheet …
│   │   ├── lib/
│   │   │   ├── api.ts          # The single API client (fetch + JWT, base URL from VITE_API_URL)
│   │   │   ├── auth.ts         # Zustand auth store (login, register, logout, session restore)
│   │   │   ├── hooks.ts        # useRequireAuth (route guard), useProtectedFile (PDF/image loader)
│   │   │   ├── pdf2img.ts      # Renders PDF page 1 to PNG in the browser (worker loaded from pdfjs-dist)
│   │   │   ├── coverLetter.ts  # Letter → plain text (Copy / Edit), word count
│   │   │   └── utils.ts
│   │   ├── routes/             # home, auth, upload, resume/:id, resume/:id/improved/:analysisId,
│   │   │                       # resume/:id/improved/:analysisId/cover-letter, wipe
│   │   ├── constants.ts        # API_BASE_URL, MAX_FILE_SIZE, ROUTES …
│   │   ├── root.tsx
│   │   └── app.css             # Tailwind + Europass CV, cover letter and print (A4) styles
│   ├── public/                 # Images, icons, README hero image
│   ├── utils/                  # aiMapper.js, cache.js
│   ├── types/index.d.ts        # User, Resume, Analysis, Feedback, EuropassCv, ImprovedResume, CoverLetter types
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── backend/                    # Express REST API  →  see backend/README.md for full API docs
│   ├── server.js
│   ├── src/
│   │   ├── config/             # env.js (validated .env), db.js (MongoDB connection)
│   │   ├── models/             # User, Resume, Analysis, ImprovedResume, CoverLetter (Mongoose)
│   │   ├── controllers/        # authController, resumeController, improveController, coverLetterController
│   │   ├── routes/             # authRoutes, resumeRoutes
│   │   ├── middleware/         # auth (JWT), upload (Multer), validate, errorHandler
│   │   ├── services/           # pdfService (pdf-parse), geminiService (AI + retries), europassService,
│   │   │                       # coverLetterService
│   │   └── utils/              # ApiError, token, files
│   ├── uploads/                # Uploaded files (git-ignored)
│   ├── .env.example
│   └── package.json
├── database/
│   ├── mongodb-schema.md       # Collections, fields, relationships, indexes
│   ├── schema.sql              # Relational equivalent of the ERD (documentation)
│   ├── seed.js                 # Demo user + resume + analysis + improved resume + cover letter (npm run seed)
│   └── sample-data.json        # Example documents
├── documentation/              # Submitted academic reports (proposal, SRS, design, progress)
├── screenshots/                # UI screenshots
├── .gitignore
└── README.md
```

---

## 🔑 6. Features

- **Sign up / Log in** with email and password (bcrypt-hashed passwords, JWT sessions valid for 7 days).
- **Protected pages**: logged-out visitors are redirected to `/auth?next=…` and returned to the page afterwards.
- **Upload & analyze**: company name, job title, job description + PDF resume (drag & drop, PDF only, max 10 MB).
- **AI feedback** in a fixed structure: overall score, ATS score + tips, Tone & Style, Content, Structure and Skills,
  each with a score and explained "good" / "improve" tips.
- **History dashboard**: every resume with its latest score and preview image.
- **Review page**: resume preview (click to open the original PDF) next to the full feedback.
- **Improve My Resume (Europass)**: after an analysis, one click rewrites the resume in the official
  **EU Europass CV** format, based on the feedback tips and the job description:
  - **"What we improved" report**: every change grouped by ATS / Tone & Style / Content / Structure / Skills,
    shown as _before → after_ with the reason.
  - **Europass CV** in the classic layout: labels/dates on the left, content on the right, blue section headings,
    and a CEFR language table (Listening, Reading, Spoken production/interaction, Writing).
  - **Never invents anything**: the AI only rephrases what is in your resume. Missing information
    (phone, dates, CEFR levels …) appears as **yellow `[placeholders]`**. Job titles stay exactly as in your resume,
    and numbers that are not in your resume are replaced by placeholders automatically.
  - **European-ready details**: all dates `MM/YYYY`, "Expected MM/YYYY" for ongoing degrees, qualifications written
    in full (e.g. "Higher Secondary Certificate (HSC)"), grades with their scale ("GPA 4.67 / 5.00") and the
    **EQF level** of each degree.
  - **Edit in place and save**: click any text in the CV, then **Save changes** (stored in the database).
    **Reset to AI version** brings back the original. The cover letter uses your edited CV.
  - **Download PDF** (A4, print-optimised) and **Regenerate**. The review page then shows "View Improved Resume".
- **Generate Cover Letter**: from the improved resume, one click writes a matching cover letter. This implements
  `cover_letter_text` from our Week 03/04 ERD (`CAREER_COPILOT_ASSESSMENT`).
  - **Optional form**: hiring manager name, company address, where you found the job, **Formal / Modern** tone.
  - **European business-letter layout** on an A4 sheet, in the same fonts and colours as the Europass CV: sender block,
    date, recipient, bold subject line, 3–4 paragraphs (250–400 words), sign-off. The salutation is
    "Dear Ms. Rahman" when a title is given, and "Dear Hiring Manager" + "Kind regards" when no name is known.
  - **Never invents facts**: achievements come only from your CV. Unknown company details become yellow `[placeholders]`.
  - **"Why this letter works"** panel: which CV facts were matched to which job requirements, plus the word count.
  - **Edit + Save** (stored in the database), **Copy text**, **Download PDF** (one A4 page) and **Regenerate**.
- **Wipe page** (`/wipe`): delete all of your resumes, analyses, improved resumes, cover letters and files.
- **Logout** from the navbar.

### Validation & security

- Frontend: required fields, password confirmation, PDF-only dropzone with size limit, clear error messages.
- Backend: `express-validator` on every input, PDF magic-byte check, Multer size limit, JWT auth middleware,
  per-user ownership checks, CORS restricted to the frontend URL, helmet headers, login rate limiting,
  central error handler. Secrets live only in `.env` files, which are git-ignored.
  Details: [backend/README.md › Security](backend/README.md#4-security-measures).

---

## ⚙️ 7. Setup & Run Locally

### Prerequisites

- **Node.js 24 LTS** (recommended; 22.22+ also works) and npm — React Router 8 warns on older versions.
  Check with `node -v`. On Windows you can upgrade with `winget install OpenJS.NodeJS.LTS`.
- A free **MongoDB Atlas** account → connection string
- A free **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)

### 0) Get the MongoDB Atlas connection string (one time)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **free M0 cluster**.
2. **Security → Database Access → Add New Database User** — choose a username and an auto-generated password.
   ⚠️ This is a _database user_, not your Atlas website login.
3. **Security → Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)**.
4. **Database → Connect → Drivers** → copy the string and edit it like this:
   ```text
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/resumind?retryWrites=true&w=majority
   ```
   Replace `<db_username>` / `<db_password>` **including the `< >` brackets**, and put the database name
   `resumind` after `.mongodb.net/`.

### 0b) Get a Gemini API key (one time)

Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in with Google, click **Create API key**
and copy the key (starts with `AIza`). It is free; the free tier has per-minute limits.

### 1) Clone

```bash
git clone https://github.com/mahamud894/AI_Resume_Analyzer.git
cd AI_Resume_Analyzer
```

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
# open .env and fill in MONGO_URI, JWT_SECRET and GEMINI_API_KEY
# generate a JWT_SECRET with:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run seed                  # optional: demo account demo@resumind.dev / Demo@1234
npm run dev                   # → http://localhost:5000  (check http://localhost:5000/api/health)
```

You should see `✅ MongoDB connected` and `🚀 API running on http://localhost:5000`.
`npm run dev` restarts the server automatically when you change files in `src/`, `server.js` or `.env`.

### 3) Frontend (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm run dev                   # → http://localhost:5173
```

Open **http://localhost:5173**, then sign up or log in with the demo account
**demo@resumind.dev / Demo@1234** (after `npm run seed`).

> Keep **both** terminals open while using the app: the frontend (5173) talks to the backend (5000).

### 4) Production build

```bash
cd frontend && npm run build && npm start     # serves the built app
cd backend  && npm start
```

Docker (frontend): `docker build --build-arg VITE_API_URL=https://your-api.example.com -t resumind-frontend frontend`

### 5) Troubleshooting

| Problem                                                             | Cause → Fix                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `❌ Seed failed: bad auth : authentication failed`                  | Wrong Atlas credentials. Use the **Database Access** user (not your Atlas login), remove the `< >` brackets, and if needed reset the password there (wait ~30 s after saving). Special characters like `@ : / ? #` in the password must be URL-encoded. |
| `Could not connect to MongoDB` / timeout                            | Your IP is not allowed → Atlas **Network Access → 0.0.0.0/0**.                                                                                                                                                                                          |
| Data appears in a database called `test`                            | `MONGO_URI` has no database name → add `/resumind` after `.mongodb.net`.                                                                                                                                                                                |
| Frontend starts on **5174** instead of 5173                         | Another app is using port 5173. Close it (or the old terminal). The backend only accepts requests from `CLIENT_URL` (5173), so use 5173 or update `CLIENT_URL`.                                                                                         |
| "Cannot reach the server. Is the backend running?"                  | Start the backend (`cd backend && npm run dev`) and check `VITE_API_URL` in `frontend/.env`.                                                                                                                                                            |
| "The AI model is busy right now"                                    | Gemini free tier is overloaded (HTTP 503). The backend already retried 3×; wait a minute and try again.                                                                                                                                                 |
| "AI rate limit reached"                                             | Too many analyses per minute on the free tier — wait about a minute.                                                                                                                                                                                    |
| "The free daily AI quota is used up"                                | Each Gemini model has a free daily limit (e.g. 20 requests/day for `gemini-flash-latest`). Set `GEMINI_MODEL=gemini-flash-lite-latest` in `backend/.env` (separate, bigger quota) or wait until the next day.                                           |
| "AI service is not configured / misconfigured"                      | `GEMINI_API_KEY` missing or wrong in `backend/.env`; restart the backend.                                                                                                                                                                               |
| "Could not read enough text from this PDF"                          | The PDF is a scanned image. Export your resume as a text-based PDF (e.g. from Word / Google Docs).                                                                                                                                                      |
| Warning `react-router requires a Node version greater than 22.22.0` | Upgrade Node.js to 24 LTS (see Prerequisites).                                                                                                                                                                                                          |

---

## 🔐 8. Environment Variables

**backend/.env**

| Variable           | Required | Description                                                              |
| ------------------ | -------- | ------------------------------------------------------------------------ |
| `MONGO_URI`        | ✅       | MongoDB Atlas connection string (with database name `resumind`)          |
| `JWT_SECRET`       | ✅       | Long random string used to sign tokens                                   |
| `GEMINI_API_KEY`   | ✅\*     | Google Gemini key (\*server starts without it, but analysis returns 503) |
| `PORT`             |          | API port, default `5000`                                                 |
| `CLIENT_URL`       |          | Frontend origin for CORS, default `http://localhost:5173`                |
| `JWT_EXPIRES_IN`   |          | Token lifetime, default `7d`                                             |
| `GEMINI_MODEL`     |          | Default `gemini-flash-latest`                                            |
| `MAX_FILE_SIZE_MB` |          | Upload limit, default `10`                                               |

**frontend/.env**

| Variable       | Description                                       |
| -------------- | ------------------------------------------------- |
| `VITE_API_URL` | Backend base URL, default `http://localhost:5000` |

---

## 🌐 9. API Summary

Base URL `http://localhost:5000/api` · 🔒 = requires `Authorization: Bearer <token>`

| Method | Route                                   | Auth | Purpose                                                 |
| ------ | --------------------------------------- | ---- | ------------------------------------------------------- |
| POST   | `/auth/register`                        |      | Create account → `{ token, user }`                      |
| POST   | `/auth/login`                           |      | Log in → `{ token, user }`                              |
| GET    | `/auth/me`                              | 🔒   | Current user                                            |
| POST   | `/resume/upload`                        | 🔒   | Upload PDF (+ preview image)                            |
| POST   | `/resume/analyze`                       | 🔒   | Analyze a resume against a job with Gemini              |
| GET    | `/resume`                               | 🔒   | My history (resumes with their analyses)                |
| GET    | `/resume/:id`                           | 🔒   | One resume with its analyses                            |
| GET    | `/resume/:id/file`                      | 🔒   | Download the PDF                                        |
| GET    | `/resume/:id/image`                     | 🔒   | Download the preview image                              |
| DELETE | `/resume/:id`                           | 🔒   | Delete resume, its analyses, improved resumes, cover letters and files |
| POST   | `/resume/analysis/:analysisId/improve`  | 🔒   | Generate / regenerate the Europass improved resume      |
| GET    | `/resume/analysis/:analysisId/improved` | 🔒   | Get the saved improved resume (404 if none yet)         |
| PUT    | `/resume/analysis/:analysisId/improved` | 🔒   | Save your inline CV edits (`null` = reset to AI version) |
| POST   | `/resume/analysis/:analysisId/cover-letter` | 🔒 | Generate / regenerate the cover letter (needs the improved resume) |
| GET    | `/resume/analysis/:analysisId/cover-letter` | 🔒 | Get the saved cover letter (404 if none yet)          |
| PUT    | `/resume/analysis/:analysisId/cover-letter` | 🔒 | Save your edited letter text                          |

Full request/response examples and error codes: **[backend/README.md](backend/README.md)**.
Database design: **[database/mongodb-schema.md](database/mongodb-schema.md)**.

---

## 🗄️ 10. Database Design (summary)

`users` **1 ── N** `resumes` **1 ── N** `analyses` **1 ── 0..1** `improvedresumes` **1 ── 0..1** `coverletters`

- **users** — username, email (unique), passwordHash, createdAt
- **resumes** — userId → users, filePath, imagePath, originalName, fileSize, uploadDate
- **analyses** — resumeId → resumes, userId → users, companyName, jobTitle, jobDescription, feedback (embedded), createdAt
- **improvedresumes** — analysisId → analyses (unique), resumeId → resumes, userId → users, europassCv (embedded),
  changes (embedded array), createdAt
- **coverletters** — improvedResumeId → improvedresumes (unique), analysisId → analyses (unique), userId → users,
  inputs, letter (embedded), editedText, createdAt, updatedAt. This is the original ERD's `cover_letter_text`.

---

## 📱 11. Responsive Design

The interface is built with **Tailwind CSS v4** utility classes:

- **Desktop:** multi-column history grid and a split review page (resume preview left, feedback right).
- **Tablet:** columns collapse and side margins shrink while buttons stay reachable.
- **Mobile:** single-column layout; the review page stacks the feedback above the preview.

---

## 🔄 12. Migration Note (Puter.js → own backend)

Earlier versions (Week 07) ran fully "serverless" through the Puter.js SDK (`puter.auth`, `puter.fs`, `puter.kv`,
`puter.ai`). The project now has its own backend that matches the course ERD:

| Before (Puter.js)          | Now                                                       |
| -------------------------- | --------------------------------------------------------- |
| `puter.auth.signIn()`      | `POST /api/auth/login` / `register` (bcrypt + JWT)        |
| `puter.fs.upload()`        | `POST /api/resume/upload` (Multer → `uploads/`)           |
| `puter.kv.set/list()`      | MongoDB Atlas collections via Mongoose                    |
| `puter.ai.chat()` (GPT-4o) | `POST /api/resume/analyze` (pdf-parse + Gemini JSON mode) |

The AI prompt now enforces the exact `Feedback` structure used by the UI components, which fixed the earlier
mismatch between the AI response and the review page.
