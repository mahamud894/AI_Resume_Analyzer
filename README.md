# AI-Powered Resume Analyzer and Career Copilot

[![CI](https://github.com/mahamud894/AI_Resume_Analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/mahamud894/AI_Resume_Analyzer/actions/workflows/ci.yml)

A full-stack AI Resume Analyzer. Candidates create an account, upload their resume as a PDF, enter the
company, job title and job description, and receive an AI-generated evaluation: an overall score,
an ATS (Applicant Tracking System) score and detailed tips on tone & style, content, structure and skills.
Every analysis is stored, so users can track all their applications in one dashboard.

**🌐 Live demo:** https://ai-resume-analyzer-psi-lime.vercel.app · **API:** https://resumind-api-3kpd.onrender.com/api/health

**📄 Final documents (Weeks 11–14):** [documentation/](documentation/) — final report, user manual, API documentation, deployment sheet, presentation and viva guide.

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

1. **Mahammad Hasan (ID: 11220320828)** — _Team Leader / Frontend Developer + UI/UX Designer_
   - React Router 8 app structure, Zustand auth store, the API client (`lib/api.ts`) and protected routes.
   - All pages: auth, upload, history dashboard, review page, Europass CV editor, cover letter, wipe.
   - UI/UX design with Tailwind CSS 4: responsive layouts for mobile, tablet and desktop.
   - New: **Analyze for another job** (analysis switcher), **Delete** button on resume cards, **Account page**
     (change password, delete account) and the shared job form component.
2. **Shanawaz Sakib (ID: 11220320916)** — _Core System Integration Engineer_
   - Google Gemini integration: JSON-mode prompts and schemas for analysis, Europass rewrite and cover letter,
     retries for temporary AI errors, and the Week 08 AI response mapper / cache prototype.
   - Connecting frontend, backend and AI end to end (PDF → text → Gemini → saved feedback → UI).
   - New: **AI rate limit** (15 Gemini requests per user per hour) and **Docker Compose** setup for the whole app.
3. **Ashikur Rahman Himel (ID: 11220320833)** — _Database Storage & Quality Controller_
   - MongoDB Atlas schema and Mongoose models (ERD, `mongodb-schema.md`, `schema.sql`, seed data),
     uploaded file storage and input validation.
   - New: **automated API tests** (Vitest + Supertest, in-memory MongoDB) and the **dependency security audit**
     (frontend vulnerabilities fixed, 0 remaining).
4. **Rasel Ratul (ID: 11220320827)** — _Backend Developer_
   - Express 5 REST API: JWT authentication, Multer PDF upload, controllers, routes and central error handling.
   - Security: bcrypt, helmet, CORS, login rate limiting, ownership checks and PDF magic-byte check.
   - New: **change password** (logs out other devices) and **delete account** endpoints, and the backend **Dockerfile**.

---

## 🏗️ 3. System Architecture

```text
┌──────────────────────────┐   HTTPS + JSON    ┌───────────────────────────┐   Mongoose   ┌─────────────────┐
│  Frontend (React 19)     │  Authorization:   │  Backend (Express 5)      │ ───────────▶ │  MongoDB Atlas  │
│  React Router · Tailwind │  Bearer <JWT>     │  REST API · JWT · Multer  │              │ users / resumes │
│  Zustand · pdf.js        │ ────────────────▶ │  pdf-parse · validation   │              │ / analyses …    │
│  localhost:5173          │ ◀──────────────── │  localhost:5000           │              │ + GridFS files  │
│  (live: Vercel)          │                   │  (live: Render)           │              └─────────────────┘
└──────────────────────────┘                   │                           │   @google/genai
                                               │                           │ ───────────▶ ┌─────────────────┐
                                               │                           │  JSON mode   │  Google Gemini  │
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
| Tooling  | Vite, Docker + Docker Compose, Vitest + Supertest (API tests), npm                                                                |

---

## 📂 5. Repository Structure

```text
AI-Resume-Analyzer/
├── frontend/                   # React web application
│   ├── app/
│   │   ├── components/         # Navbar, FileUploader, ResumeCard, Summary, ATS, Details, Score*,
│   │   │                       # EuropassCv, ImprovementReport, CoverLetterSheet, LandingSections, AuthCard,
│   │                       # PageChrome, ProgressSteps, BeforeAfter, ScoreHistoryChart, ReportPrint …
│   │   ├── lib/
│   │   │   ├── api.ts          # The single API client (fetch + JWT, base URL from VITE_API_URL)
│   │   │   ├── auth.ts         # Zustand auth store (login, register, logout, session restore)
│   │   │   ├── hooks.ts        # useRequireAuth (route guard), useProtectedFile (PDF/image loader)
│   │   │   ├── pdf2img.ts      # Renders PDF page 1 to PNG in the browser (worker loaded from pdfjs-dist)
│   │   │   ├── coverLetter.ts  # Letter → plain text (Copy / Edit), word count
│   │   │   └── utils.ts
│   │   ├── routes/             # landing (/), dashboard (home), auth, upload, resume/:id, resume/:id/improved/:analysisId,
│   │   │                       # resume/:id/improved/:analysisId/cover-letter, wipe
│   │   ├── constants.ts        # API_BASE_URL, MAX_FILE_SIZE, ROUTES …
│   │   ├── root.tsx
│   │   └── app.css             # Tailwind + Europass CV, cover letter and print (A4) styles
│   ├── public/                 # Images, icons, README hero image
│   ├── utils/                  # aiMapper.js, cache.js — Week 08 prototype (client-side AI mapping + cache),
│   │                           # kept for the record; the app now gets validated feedback from the backend
│   ├── types/index.d.ts        # User, Resume, Analysis, Feedback, EuropassCv, ImprovedResume, CoverLetter types
│   ├── .env.example
│   ├── Dockerfile
│   ├── vercel.json             # Vercel: static SPA build of the frontend
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
│   ├── scripts/                # migrate-uploads-to-gridfs.js (one-time move from the old uploads/ folder)
│   ├── .env.example
│   └── package.json
├── database/
│   ├── mongodb-schema.md       # Collections, fields, relationships, indexes
│   ├── schema.sql              # Relational equivalent of the ERD (documentation)
│   ├── seed.js                 # Demo user + resume + analysis + improved resume + cover letter (npm run seed)
│   └── sample-data.json        # Example documents
├── documentation/              # Submitted academic reports (proposal, SRS, design, progress)
├── screenshots/                # UI screenshots (desktop, tablet, mobile) + sample-report.pdf
├── .github/workflows/ci.yml    # CI: backend tests + frontend type check & build on every push
├── docker-compose.yml          # Frontend + backend containers (docker compose up --build)
├── render.yaml                 # Render Blueprint for the backend API
├── .gitignore
└── README.md
```

---

## 🔑 6. Features

- **Two ways to sign up / log in**:
  - **Email and password** (bcrypt-hashed passwords, JWT sessions valid for 7 days).
  - **Sign in with Google**: the backend verifies Google's ID token (signature, our Client ID, expiry, verified
    email). A Google login with the same email as an existing account is linked to it, so there are no duplicates.
    Google-only accounts can set a password later on the Account page to use both ways.
- **Protected pages**: logged-out visitors are redirected to `/auth?next=…` and returned to the page afterwards.
- **Upload & analyze**: company name, job title, job description + PDF resume (drag & drop, PDF only, max 10 MB).
- **AI feedback** in a fixed structure: overall score, ATS score + tips, Tone & Style, Content, Structure and Skills,
  each with a score and explained "good" / "improve" tips.
- **History dashboard**: every resume with its latest score and preview image, and a **Delete** button on each card.
- **Landing page** (`/`) with how it works, features and the team; logged-in users go straight to their dashboard,
  and logging out returns to the landing page. Scroll and hover effects (off for "reduce motion" users).
- **Step-by-step progress** while the AI works (e.g. Reading your PDF → Uploading securely → AI is analyzing → Done),
  with a note when the free server is waking up.
- **Review page**: resume preview (click to open the original PDF) next to the full feedback.
- **Score history chart**: every analysis of a resume (oldest → newest) and the score of the improved CV for the same
  job, with hover details and a table view.
- **Download Report (PDF)**: a printable A4 report with the score overview and every tip
  (example: [`screenshots/sample-report.pdf`](screenshots/sample-report.pdf)).
- **Analyze for another job**: run the same resume against a new job description without uploading it again.
  A dropdown switches between all jobs the resume was analyzed for (the choice is kept in the URL, `?analysis=<id>`).
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
  - **Before / After score**: one click scores the improved CV (placeholders removed) for the same job and shows
    the old and new score side by side, with the change per category.
- **Generate Cover Letter**: from the improved resume, one click writes a matching cover letter. This implements
  `cover_letter_text` from our Week 03/04 ERD (`CAREER_COPILOT_ASSESSMENT`).
  - **Optional form**: hiring manager name, company address, where you found the job, **Formal / Modern** tone.
  - **European business-letter layout** on an A4 sheet, in the same fonts and colours as the Europass CV: sender block,
    date, recipient, bold subject line, 3–4 paragraphs (250–400 words), sign-off. The salutation is
    "Dear Ms. Rahman" when a title is given, and "Dear Hiring Manager" + "Kind regards" when no name is known.
  - **Never invents facts**: achievements come only from your CV. Unknown company details become yellow `[placeholders]`.
  - **"Why this letter works"** panel: which CV facts were matched to which job requirements, plus the word count.
  - **Edit + Save** (stored in the database), **Copy text**, **Download PDF** (one A4 page) and **Regenerate**.
- **Account page** (`/account`, click "Hi, name" in the navbar): profile details, **change password** (logs out
  your other devices) and **delete account** (removes the account and all of its data and files; asks for the password).
- **Wipe page** (`/wipe`): delete all of your resumes, analyses, improved resumes, cover letters and files.
- **Logout** from the navbar.
- **Branded 404 page** for unknown links.

### Validation & security

- Frontend: required fields, password of at least 8 characters + confirmation, PDF-only dropzone with size limit, clear error messages.
- Backend: `express-validator` on every input, PDF magic-byte check, Multer size limit, JWT auth middleware,
  per-user ownership checks, CORS restricted to the frontend URL, helmet headers, login rate limiting,
  AI rate limiting (15 Gemini requests per user per hour), central error handler. Secrets live only in `.env` files, which are git-ignored.
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

### 0c) Optional: "Sign in with Google" (one time)

The app works without it (the Google button is simply hidden). To turn it on:

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project, e.g. "Resumind".
2. **APIs & Services → OAuth consent screen**: app name + your email, user type **External**; add your team's
   Gmail addresses under **Test users**.
3. **Credentials → Create credentials → OAuth client ID** → type **Web application**. Under
   **Authorized JavaScript origins** add `http://localhost:5173` and `http://localhost:3000`.
4. Copy the **Client ID** (`…apps.googleusercontent.com`) into **both** `backend/.env` (`GOOGLE_CLIENT_ID`) and
   `frontend/.env` (`VITE_GOOGLE_CLIENT_ID`), then restart both `npm run dev` terminals.
   The Client ID is public; the **Client Secret is not needed**, do not put it anywhere.

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

**Docker (whole app):** create `backend/.env` first (step 2), then from the project root:

```bash
docker compose up --build     # frontend → http://localhost:3000, backend → http://localhost:5000
# With "Sign in with Google": pass backend/.env so the frontend image gets GOOGLE_CLIENT_ID too
docker compose --env-file backend/.env up --build
docker compose down           # stop
```

The backend container reads its secrets from `backend/.env` at run time (they are never copied into the image)
and uses your Atlas database. For a deployed API, change `VITE_API_URL` and `CLIENT_URL` in `docker-compose.yml`.

- Stop `npm run dev` first: the containers need ports **5000** and **3000**.
- Uploaded PDFs and previews are stored in MongoDB Atlas (GridFS), so `npm run dev`, Docker and the live site
  all see the same resumes when they use the same `MONGO_URI`.
- Docker Desktop on Windows needs WSL 2, which needs CPU virtualization: after installing, **restart Windows**,
  and if it still does not start, enable *Intel Virtualization Technology* in the BIOS.

### Tests

```bash
cd backend && npm test        # API tests with an in-memory MongoDB and a mocked Gemini (no .env or quota needed)
```

Covered: auth (incl. 8-character passwords), Google sign-in, upload/analyze/delete, Europass CV (generate, edit,
reset, privacy), Before / After score and cover letter (generate, salutation/sign-off, edits, privacy).
**GitHub Actions** runs these tests plus the frontend type check and build on every push
(see the CI badge at the top).

### 5) Deploy live (frontend on Vercel, backend on Render)

Both are free and redeploy automatically on every push to `main`. Files and data stay in MongoDB Atlas.

**First, one time:** if you used the app before uploads moved to GridFS, run `cd backend && npm run migrate:uploads`
(dry run), then `npm run migrate:uploads -- --apply` to copy the old `backend/uploads/` files into Atlas.

1. **Backend → Render** ([render.com](https://render.com), sign up with GitHub)
   - **New → Blueprint** → choose this repository. Render reads [`render.yaml`](render.yaml) and creates the
     `resumind-api` web service (root `backend`, `npm ci --omit=dev`, `npm start`, health check `/api/health`).
   - Fill in the values it asks for: `MONGO_URI` (tip: another database name than local, e.g. `/resumind-live`),
     `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, and for now `CLIENT_URL=https://example.com` (fixed in step 3).
     `JWT_SECRET` is generated by Render.
   - Copy the API URL, e.g. `https://resumind-api.onrender.com`, and check `…/api/health` shows `"status":"ok"`.
2. **Frontend → Vercel** ([vercel.com](https://vercel.com), sign up with GitHub)
   - **Add New → Project** → import this repository → **Root Directory: `frontend`**. The rest comes from
     [`frontend/vercel.json`](frontend/vercel.json): on Vercel the app is built as a static SPA (`build/client`).
   - Environment variables: `VITE_API_URL` = the Render URL (no trailing slash), `VITE_GOOGLE_CLIENT_ID`.
   - Deploy and copy the site URL, e.g. `https://resumind.vercel.app`.
3. **Connect them**
   - Render → `resumind-api` → Environment → `CLIENT_URL` = the Vercel URL → save (it redeploys).
   - Google Cloud Console → Credentials → your OAuth client → **Authorized JavaScript origins** → add the Vercel URL.
   - MongoDB Atlas → Network Access must allow `0.0.0.0/0` (Render has no fixed IP).

Free-plan limits: the Render API sleeps after 15 minutes without visitors, so the first request afterwards takes
about 50 seconds. Vercel preview URLs (other branches) are blocked by CORS; use the main production URL.
Changing a `VITE_…` variable on Vercel needs a **Redeploy**, because it is built into the JavaScript.

### 6) Troubleshooting

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
| `GOOGLE_CLIENT_ID` |          | OAuth Client ID for "Sign in with Google" (empty = turned off, 503)      |
| `MAX_FILE_SIZE_MB` |          | Upload limit, default `10`                                               |
| `TRUST_PROXY`      |          | Proxies in front of the API: `1` on Render, `0` (default) locally/Docker |

**frontend/.env**

| Variable       | Description                                       |
| -------------- | ------------------------------------------------- |
| `VITE_API_URL` | Backend base URL, default `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Same Client ID as `GOOGLE_CLIENT_ID`; empty = Google button hidden |

---

## 🌐 9. API Summary

Base URL `http://localhost:5000/api` · 🔒 = requires `Authorization: Bearer <token>`

| Method | Route                                       | Auth | Purpose                                                                |
| ------ | ------------------------------------------- | ---- | ---------------------------------------------------------------------- |
| POST   | `/auth/register`                            |      | Create account → `{ token, user }`                                     |
| POST   | `/auth/login`                               |      | Log in → `{ token, user }`                                             |
| POST   | `/auth/google`                              |      | Sign in with Google: `{ credential }` (ID token) → `{ token, user }`   |
| GET    | `/auth/me`                                  | 🔒   | Current user                                                           |
| PUT    | `/auth/password`                            | 🔒   | Change password (Google-only accounts: set a first one) → new `{ token, user }` |
| DELETE | `/auth/me`                                  | 🔒   | Delete the account and all its data (`{ password }`, or `{ confirmEmail }` for Google-only) |
| POST   | `/resume/upload`                            | 🔒   | Upload PDF (+ preview image)                                           |
| POST   | `/resume/analyze`                           | 🔒   | Analyze a resume against a job with Gemini                             |
| GET    | `/resume`                                   | 🔒   | My history (resumes with their analyses)                               |
| GET    | `/resume/:id`                               | 🔒   | One resume with its analyses                                           |
| GET    | `/resume/:id/file`                          | 🔒   | Download the PDF                                                       |
| GET    | `/resume/:id/image`                         | 🔒   | Download the preview image                                             |
| DELETE | `/resume/:id`                               | 🔒   | Delete resume, its analyses, improved resumes, cover letters and files |
| POST   | `/resume/analysis/:analysisId/improve`      | 🔒   | Generate / regenerate the Europass improved resume                     |
| GET    | `/resume/analysis/:analysisId/improved`     | 🔒   | Get the saved improved resume (404 if none yet)                        |
| PUT    | `/resume/analysis/:analysisId/improved`     | 🔒   | Save your inline CV edits (`null` = reset to AI version)               |
| POST   | `/resume/analysis/:analysisId/cover-letter` | 🔒   | Generate / regenerate the cover letter (needs the improved resume)     |
| GET    | `/resume/analysis/:analysisId/cover-letter` | 🔒   | Get the saved cover letter (404 if none yet)                           |
| PUT    | `/resume/analysis/:analysisId/cover-letter` | 🔒   | Save your edited letter text                                           |

Full request/response examples and error codes: **[backend/README.md](backend/README.md)**.
Database design: **[database/mongodb-schema.md](database/mongodb-schema.md)**.

---

## 🗄️ 10. Database Design (summary)

`users` **1 ── N** `resumes` **1 ── N** `analyses` **1 ── 0..1** `improvedresumes` **1 ── 0..1** `coverletters`

- **users** — username, email (unique), passwordHash (empty for Google-only accounts), hasPassword, googleId (unique),
  passwordChangedAt, createdAt
- **resumes** — userId → users, fileId, imageId (→ GridFS `uploads.files`), originalName, fileSize, uploadDate
- **uploads.files / uploads.chunks** — GridFS: the uploaded PDFs and preview images themselves (255 KB chunks)
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
| `puter.fs.upload()`        | `POST /api/resume/upload` (Multer → MongoDB GridFS)       |
| `puter.kv.set/list()`      | MongoDB Atlas collections via Mongoose                    |
| `puter.ai.chat()` (GPT-4o) | `POST /api/resume/analyze` (pdf-parse + Gemini JSON mode) |

The AI prompt now enforces the exact `Feedback` structure used by the UI components, which fixed the earlier
mismatch between the AI response and the review page.
