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
│   │   └── Analysis.js
│   ├── controllers/           # Request handlers (the "what happens" logic)
│   │   ├── authController.js
│   │   └── resumeController.js
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
│   │   └── geminiService.js   # Prompt, JSON schema, Gemini call, response normalization
│   └── utils/
│       ├── ApiError.js        # Error with an HTTP status code
│       ├── token.js           # sign / verify JWT
│       └── files.js           # upload path helpers, PDF magic-byte check
├── uploads/                   # Uploaded PDFs + preview images (git-ignored)
├── .env.example               # Template for your .env
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
| GET    | `/auth/me`                | 🔒   | –                                                         | 200 `{ user }` |
| POST   | `/resume/upload`          | 🔒   | `multipart/form-data`: `resume` (PDF, required), `image` (PNG/JPEG, optional) | 201 `{ resume }` |
| POST   | `/resume/analyze`         | 🔒   | JSON `{ resumeId, companyName?, jobTitle, jobDescription }` | 201 `{ analysis }` |
| GET    | `/resume`                 | 🔒   | –                                                         | 200 `{ resumes: [...] }` (newest first, each with `analyses`) |
| GET    | `/resume/:id`             | 🔒   | –                                                         | 200 `{ resume }` |
| GET    | `/resume/:id/file`        | 🔒   | –                                                         | 200 PDF bytes (`application/pdf`) |
| GET    | `/resume/:id/image`       | 🔒   | –                                                         | 200 PNG bytes |
| DELETE | `/resume/:id`             | 🔒   | –                                                         | 200 `{ message, id }` |

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
Deletes the resume, **all its analyses** and both files on disk.
```json
{ "message": "Resume deleted", "id": "6aca15131f91ced92f7ef8c2" }
```

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
| Unauthorized access            | `requireAuth` middleware verifies the JWT on every resume route            |
| Reading other users' data      | Every query filters by `userId = req.user._id`; others get `404`           |
| Password guessing              | `express-rate-limit`: 20 login/register attempts per 15 min per IP         |
| Malicious uploads              | PDF-only (extension + MIME + `%PDF-` magic bytes), 10 MB limit, max 2 files, random server-side file names |
| Bad input / NoSQL injection    | `express-validator` on all bodies and ids; Mongoose `strictQuery`          |
| Cross-site requests            | CORS allows only `CLIENT_URL`                                              |
| Common HTTP attacks            | `helmet` security headers; JSON body limited to 1 MB                       |
| Leaking internals              | Central error handler; stack traces only in development                    |
| Leaked secrets                 | All secrets in `.env`, which is git-ignored (`.env.example` is committed)  |
