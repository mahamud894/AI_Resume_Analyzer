# AI-Powered Resume Analyzer and Career Copilot

A full-stack AI Resume Analyzer. Candidates create an account, upload their resume as a PDF, enter the
company, job title and job description, and receive an AI-generated evaluation: an overall score,
an ATS (Applicant Tracking System) score and detailed tips on tone & style, content, structure and skills.
Every analysis is stored, so users can track all their applications in one dashboard.

![Resumind](frontend/public/readme/hero.webp)

---

## 📋 1. Course & Project Metadata
* **Course Code:** CSE4204 (Mobile Computing Lab)
* **Academic Semester:** Summer 2026
* **Academic Section:** 8A
* **Team Name:** CSE4204-8A-T05
* **Academic Institution:** Northern University of Business and Technology, Khulna
* **Submitted To:** **Md. Riaz Mahmud**, Assistant Professor, Department of Computer Science and Engineering

---

## 👥 2. Team Engineering Roster & Roles
1. **Mahammad Hasan (ID: 11220320828)** — *Team Leader / Frontend Architecture Lead*
    * Boilerplate compilation, global store setup via Zustand, and component logic.
2. **Shanawaz Sakib (ID: 11220320916)** — *Core System Integration Engineer*
    * Puter.js SDK orchestration, AI semantic prompt engineering, and response mapping.
3. **Ashikur Rahman Himel (ID: 11220320833)** — *Database Storage & Quality Controller*
    * File system streams handling, input validations, error-catch routines, and QA.
4. **Rasel Ratul (ID: 11220320827)** — *UI-UX & Tailwind Matrix Designer*
    * High-fidelity interface development using Tailwind CSS v4 layout systems.

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

---

## 💻 4. Technology Stack

| Layer      | Technology                                                                        |
|------------|-----------------------------------------------------------------------------------|
| Frontend   | React 19, React Router 8 (SSR), TypeScript 5, Tailwind CSS 4, Zustand 5, pdf.js, react-dropzone |
| Backend    | Node.js, Express 5, Mongoose 9, JSON Web Tokens, bcryptjs, Multer, pdf-parse, express-validator, helmet, cors, express-rate-limit |
| Database   | MongoDB Atlas (cloud, free M0 cluster)                                            |
| AI         | Google Gemini API (`@google/genai`, structured JSON output)                       |
| Tooling    | Vite, Docker (frontend), npm                                                      |

---

## 📂 5. Repository Structure

```text
AI-Resume-Analyzer/
├── frontend/                   # React web application
│   ├── app/
│   │   ├── components/         # Navbar, FileUploader, ResumeCard, Summary, ATS, Details, Score* …
│   │   ├── lib/
│   │   │   ├── api.ts          # The single API client (fetch + JWT, base URL from VITE_API_URL)
│   │   │   ├── auth.ts         # Zustand auth store (login, register, logout, session restore)
│   │   │   ├── hooks.ts        # useRequireAuth (route guard), useProtectedFile (PDF/image loader)
│   │   │   ├── pdf2img.ts      # Renders PDF page 1 to PNG in the browser (worker loaded from pdfjs-dist)
│   │   │   └── utils.ts
│   │   ├── routes/             # home, auth, upload, resume/:id, wipe
│   │   ├── root.tsx
│   │   └── app.css
│   ├── public/                 # Images, icons, README hero image
│   ├── types/index.d.ts        # User, Resume, Analysis, Feedback types
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── backend/                    # Express REST API  →  see backend/README.md for full API docs
│   ├── server.js
│   ├── src/
│   │   ├── config/             # env.js (validated .env), db.js (MongoDB connection)
│   │   ├── models/             # User, Resume, Analysis (Mongoose)
│   │   ├── controllers/        # authController, resumeController
│   │   ├── routes/             # authRoutes, resumeRoutes
│   │   ├── middleware/         # auth (JWT), upload (Multer), validate, errorHandler
│   │   ├── services/           # pdfService (pdf-parse), geminiService (AI)
│   │   └── utils/              # ApiError, token, files
│   ├── uploads/                # Uploaded files (git-ignored)
│   ├── .env.example
│   └── package.json
├── database/
│   ├── mongodb-schema.md       # Collections, fields, relationships, indexes
│   ├── schema.sql              # Relational equivalent of the ERD (documentation)
│   ├── seed.js                 # Inserts a demo user + resume + analysis (npm run seed)
│   └── sample-data.json        # Example documents
├── documentation/              # Submitted academic reports (proposal, SRS, design, progress)
├── screenshots/                # UI screenshots
├── .gitignore
└── README.md
```

---

## 🔑 6. Features

* **Sign up / Log in** with email and password (bcrypt-hashed passwords, JWT sessions valid for 7 days).
* **Protected pages**: logged-out visitors are redirected to `/auth?next=…` and returned to the page afterwards.
* **Upload & analyze**: company name, job title, job description + PDF resume (drag & drop, PDF only, max 10 MB).
* **AI feedback** in a fixed structure: overall score, ATS score + tips, Tone & Style, Content, Structure and Skills,
  each with a score and explained "good" / "improve" tips.
* **History dashboard**: every resume with its latest score and preview image.
* **Review page**: resume preview (click to open the original PDF) next to the full feedback.
* **Wipe page** (`/wipe`): delete all of your resumes, analyses and files.
* **Logout** from the navbar.

### Validation & security
* Frontend: required fields, password confirmation, PDF-only dropzone with size limit, clear error messages.
* Backend: `express-validator` on every input, PDF magic-byte check, Multer size limit, JWT auth middleware,
  per-user ownership checks, CORS restricted to the frontend URL, helmet headers, login rate limiting,
  central error handler. Secrets live only in `.env` files, which are git-ignored.
  Details: [backend/README.md › Security](backend/README.md#4-security-measures).

---

## ⚙️ 7. Setup & Run Locally

### Prerequisites
* **Node.js 24 LTS** (recommended; 22.22+ also works) and npm — React Router 8 warns on older versions.
  Check with `node -v`. On Windows you can upgrade with `winget install OpenJS.NodeJS.LTS`.
* A free **MongoDB Atlas** account → connection string
* A free **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)

### 0) Get the MongoDB Atlas connection string (one time)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **free M0 cluster**.
2. **Security → Database Access → Add New Database User** — choose a username and an auto-generated password.
   ⚠️ This is a *database user*, not your Atlas website login.
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

| Problem | Cause → Fix |
|---------|-------------|
| `❌ Seed failed: bad auth : authentication failed` | Wrong Atlas credentials. Use the **Database Access** user (not your Atlas login), remove the `< >` brackets, and if needed reset the password there (wait ~30 s after saving). Special characters like `@ : / ? #` in the password must be URL-encoded. |
| `Could not connect to MongoDB` / timeout | Your IP is not allowed → Atlas **Network Access → 0.0.0.0/0**. |
| Data appears in a database called `test` | `MONGO_URI` has no database name → add `/resumind` after `.mongodb.net`. |
| Frontend starts on **5174** instead of 5173 | Another app is using port 5173. Close it (or the old terminal). The backend only accepts requests from `CLIENT_URL` (5173), so use 5173 or update `CLIENT_URL`. |
| "Cannot reach the server. Is the backend running?" | Start the backend (`cd backend && npm run dev`) and check `VITE_API_URL` in `frontend/.env`. |
| "The AI model is busy right now" | Gemini free tier is overloaded (HTTP 503). The backend already retried 3×; wait a minute and try again. |
| "AI rate limit reached" | Too many analyses per minute on the free tier — wait about a minute. |
| "AI service is not configured / misconfigured" | `GEMINI_API_KEY` missing or wrong in `backend/.env`; restart the backend. |
| "Could not read enough text from this PDF" | The PDF is a scanned image. Export your resume as a text-based PDF (e.g. from Word / Google Docs). |
| Warning `react-router requires a Node version greater than 22.22.0` | Upgrade Node.js to 24 LTS (see Prerequisites). |

---

## 🔐 8. Environment Variables

**backend/.env**

| Variable           | Required | Description                                                     |
|--------------------|----------|-----------------------------------------------------------------|
| `MONGO_URI`        | ✅       | MongoDB Atlas connection string (with database name `resumind`) |
| `JWT_SECRET`       | ✅       | Long random string used to sign tokens                          |
| `GEMINI_API_KEY`   | ✅*      | Google Gemini key (*server starts without it, but analysis returns 503) |
| `PORT`             |          | API port, default `5000`                                        |
| `CLIENT_URL`       |          | Frontend origin for CORS, default `http://localhost:5173`       |
| `JWT_EXPIRES_IN`   |          | Token lifetime, default `7d`                                    |
| `GEMINI_MODEL`     |          | Default `gemini-flash-latest`                                   |
| `MAX_FILE_SIZE_MB` |          | Upload limit, default `10`                                      |

**frontend/.env**

| Variable       | Description                                          |
|----------------|------------------------------------------------------|
| `VITE_API_URL` | Backend base URL, default `http://localhost:5000`    |

---

## 🌐 9. API Summary

Base URL `http://localhost:5000/api` · 🔒 = requires `Authorization: Bearer <token>`

| Method | Route                  | Auth | Purpose                                         |
|--------|------------------------|------|-------------------------------------------------|
| POST   | `/auth/register`       |      | Create account → `{ token, user }`              |
| POST   | `/auth/login`          |      | Log in → `{ token, user }`                      |
| GET    | `/auth/me`             | 🔒   | Current user                                    |
| POST   | `/resume/upload`       | 🔒   | Upload PDF (+ preview image)                    |
| POST   | `/resume/analyze`      | 🔒   | Analyze a resume against a job with Gemini      |
| GET    | `/resume`              | 🔒   | My history (resumes with their analyses)        |
| GET    | `/resume/:id`          | 🔒   | One resume with its analyses                    |
| GET    | `/resume/:id/file`     | 🔒   | Download the PDF                                |
| GET    | `/resume/:id/image`    | 🔒   | Download the preview image                      |
| DELETE | `/resume/:id`          | 🔒   | Delete resume, its analyses and files           |

Full request/response examples and error codes: **[backend/README.md](backend/README.md)**.
Database design: **[database/mongodb-schema.md](database/mongodb-schema.md)**.

---

## 🗄️ 10. Database Design (summary)

`users` **1 ── N** `resumes` **1 ── N** `analyses`

* **users** — username, email (unique), passwordHash, createdAt
* **resumes** — userId → users, filePath, imagePath, originalName, fileSize, uploadDate
* **analyses** — resumeId → resumes, userId → users, companyName, jobTitle, jobDescription, feedback (embedded), createdAt

---

## 📱 11. Responsive Design

The interface is built with **Tailwind CSS v4** utility classes:
* **Desktop:** multi-column history grid and a split review page (resume preview left, feedback right).
* **Tablet:** columns collapse and side margins shrink while buttons stay reachable.
* **Mobile:** single-column layout; the review page stacks the feedback above the preview.

---

## 🔄 12. Migration Note (Puter.js → own backend)

Earlier versions (Week 07) ran fully "serverless" through the Puter.js SDK (`puter.auth`, `puter.fs`, `puter.kv`,
`puter.ai`). The project now has its own backend that matches the course ERD:

| Before (Puter.js)          | Now                                                |
|----------------------------|----------------------------------------------------|
| `puter.auth.signIn()`      | `POST /api/auth/login` / `register` (bcrypt + JWT) |
| `puter.fs.upload()`        | `POST /api/resume/upload` (Multer → `uploads/`)    |
| `puter.kv.set/list()`      | MongoDB Atlas collections via Mongoose             |
| `puter.ai.chat()` (GPT-4o) | `POST /api/resume/analyze` (pdf-parse + Gemini JSON mode) |

The AI prompt now enforces the exact `Feedback` structure used by the UI components, which fixed the earlier
mismatch between the AI response and the review page.
