# MongoDB Schema — AI Resume Analyzer

The live system stores data in **MongoDB Atlas** (database name: `resumind`) through **Mongoose** models in
[`backend/src/models`](../backend/src/models). This document describes every collection, its fields,
the relationships between collections and the indexes.

> A relational (SQL) version of the same ERD is in [`schema.sql`](schema.sql) for academic documentation.

---

## 1. Entity-Relationship overview

```text
┌──────────────┐ 1        N ┌──────────────┐ 1        N ┌──────────────┐
│    users     │───────────▶│   resumes    │───────────▶│   analyses   │
│──────────────│            │──────────────│            │──────────────│
│ _id (PK)     │            │ _id (PK)     │            │ _id (PK)     │
│ username     │            │ userId (FK)  │            │ resumeId (FK)│
│ email        │            │ fileId (FK)  │            │ userId (FK)  │
│ passwordHash │            │ imageId (FK) │            │ companyName  │
│ createdAt    │            │ originalName │            │ jobTitle     │
└──────────────┘            │ fileSize     │            │ jobDescription│
        │                   │ uploadDate   │            │ feedback {…} │
        │                   └──────────────┘            │ createdAt    │
        │ 1                                    N        └──────────────┘
        └───────────────────────────────────────────────────────▲  │ 1
                                                                   │ 0..1
                                                        ┌──────────▼───────┐
                                                        │ improvedresumes  │
                                                        │──────────────────│
                                                        │ _id (PK)         │
                                                        │ analysisId (FK,U)│
                                                        │ resumeId (FK)    │
                                                        │ userId (FK)      │
                                                        │ europassCv {…}   │
                                                        │ changes [ … ]    │
                                                        │ createdAt        │
                                                        └──────────────────┘
                                                                   │ 1
                                                                   │ 0..1
                                                        ┌──────────▼───────────┐
                                                        │ coverletters         │
                                                        │──────────────────────│
                                                        │ _id (PK)             │
                                                        │ improvedResumeId(FK,U)│
                                                        │ analysisId (FK,U)    │
                                                        │ userId (FK)          │
                                                        │ inputs {…}           │
                                                        │ letter {…}           │
                                                        │ editedText           │
                                                        │ createdAt, updatedAt │
                                                        └──────────────────────┘
```

- **User 1 : N Resume** — a user can upload many resumes (`resumes.userId → users._id`).
- **Resume 1 : N Analysis** — the same resume can be analyzed against many jobs (`analyses.resumeId → resumes._id`).
- **Analysis 1 : 0..1 ImprovedResume** — each analysis can have at most one Europass version
  (`improvedresumes.analysisId → analyses._id`, **unique**). Regenerating replaces it.
- **ImprovedResume 1 : 0..1 CoverLetter** — a cover letter is written from the improved resume
  (`coverletters.improvedResumeId → improvedresumes._id`, **unique**). Regenerating replaces it.
- `analyses.userId`, `improvedresumes.userId`, `improvedresumes.resumeId`, `coverletters.analysisId` and
  `coverletters.userId` are deliberate **denormalizations**: they let the API check ownership and
  cascade-delete with one query, without joins.

MongoDB has no foreign-key constraints, so the relationships are enforced by the application:
every query filters by the logged-in user's id, and deleting a resume also deletes its analyses,
improved resumes, cover letters and files (see `deleteResume` in `resumeController.js`).

### Mapping to the original ERD (Week 03/04)

| Original ERD (`CAREER_COPILOT_ASSESSMENT` …) | Implemented as                                              |
|----------------------------------------------|-------------------------------------------------------------|
| `USER`                                       | `users`                                                     |
| `RESUME_VAULT`                               | `resumes`                                                   |
| `CAREER_COPILOT_ASSESSMENT` (job_title, job_requirements_raw, match_score, structural_feedback, tone_feedback, skills_json) | `analyses` (`jobTitle`, `jobDescription`, `feedback.overallScore`, `feedback.structure`, `feedback.toneAndStyle`, `feedback.skills`) |
| `CAREER_COPILOT_ASSESSMENT.cover_letter_text` | `coverletters` — generated `letter` + the user's `editedText`, linked to the analysis by `analysisId` (kept in its own collection because it also stores the form inputs, AI highlights and edit history timestamps) |

---

## 2. Collections

### 2.1 `users`

| Field          | Type     | Required | Constraints / notes                                       |
|----------------|----------|----------|-----------------------------------------------------------|
| `_id`          | ObjectId | auto     | Primary key                                               |
| `username`     | String   | yes      | Unique, trimmed, 3–30 chars, letters/numbers/`_`/`.`      |
| `email`        | String   | yes      | Unique, stored lowercase                                  |
| `passwordHash` | String   | yes      | bcrypt hash (10 salt rounds). `select: false` — never returned by the API |
| `passwordChangedAt` | Date | no      | Default `null`. Set on password change; JWTs issued before it are rejected. Not returned by the API |
| `createdAt`    | Date     | auto     | Set by Mongoose `timestamps`                              |

### 2.2 `resumes`

| Field          | Type     | Required | Constraints / notes                                              |
|----------------|----------|----------|------------------------------------------------------------------|
| `_id`          | ObjectId | auto     | Primary key                                                      |
| `userId`       | ObjectId | yes      | References `users._id`                                           |
| `fileId`       | ObjectId | yes      | The PDF in GridFS: references `uploads.files._id`                 |
| `imageId`      | ObjectId | no       | PNG preview of page 1 (made in the browser with pdf.js) in GridFS, or `null` |
| `originalName` | String   | yes      | File name the user uploaded (max 255)                            |
| `fileSize`     | Number   | yes      | Bytes (max 10 MB by default)                                     |
| `uploadDate`   | Date     | auto     | Defaults to now                                                  |

**File storage (GridFS):** the files themselves live in MongoDB, in the GridFS bucket `uploads`
(collections `uploads.files` for the file info and `uploads.chunks` for the 255 KB pieces), so they survive
server restarts and redeploys. Each file's `metadata` holds its `contentType` and owner `userId`.

The API never exposes `fileId`/`imageId`. Instead it returns the virtual fields
`fileUrl` (`/api/resume/:id/file`) and `imageUrl` (`/api/resume/:id/image`), which are protected by JWT.
`analyses` is a Mongoose **virtual populate** (not stored): it loads all analyses whose `resumeId` matches.

### 2.3 `analyses`

| Field            | Type     | Required | Constraints / notes                        |
|------------------|----------|----------|--------------------------------------------|
| `_id`            | ObjectId | auto     | Primary key                                |
| `resumeId`       | ObjectId | yes      | References `resumes._id`                   |
| `userId`         | ObjectId | yes      | References `users._id`                     |
| `companyName`    | String   | no       | Max 100 chars                              |
| `jobTitle`       | String   | yes      | Max 100 chars                              |
| `jobDescription` | String   | yes      | 20–10 000 chars                            |
| `feedback`       | Object   | yes      | Embedded document, see below               |
| `createdAt`      | Date     | auto     | Set by Mongoose `timestamps`               |

#### Embedded `feedback` document

The feedback is **embedded** (not a separate collection) because it is always read together with
its analysis and is never shared. Its shape is identical to the `Feedback` TypeScript type in
[`frontend/types/index.d.ts`](../frontend/types/index.d.ts):

```jsonc
{
  "overallScore": 72,                       // 0-100
  "ATS":          { "score": 78, "tips": [ { "type": "good" | "improve", "tip": "…" } ] },
  "toneAndStyle": { "score": 75, "tips": [ { "type": "good" | "improve", "tip": "…", "explanation": "…" } ] },
  "content":      { "score": 65, "tips": [ … same as toneAndStyle … ] },
  "structure":    { "score": 80, "tips": [ … ] },
  "skills":       { "score": 70, "tips": [ … ] }
}
```

`improved` is a Mongoose **virtual populate** on `analyses` (not stored, `justOne`): the API includes
`improved: { id, analysisId, createdAt }` so the frontend knows whether to show
"View Improved Resume" or "Improve My Resume (Europass)".

### 2.4 `improvedresumes` (Mongoose model `ImprovedResume`)

Created by "Improve My Resume": the resume rewritten in the official **EU Europass CV** structure,
based on the analysis feedback and the job description.

| Field        | Type     | Required | Constraints / notes                                                     |
|--------------|----------|----------|-------------------------------------------------------------------------|
| `_id`        | ObjectId | auto     | Primary key                                                             |
| `analysisId` | ObjectId | yes      | References `analyses._id`, **unique** (one improved resume per analysis) |
| `resumeId`   | ObjectId | yes      | References `resumes._id`                                                |
| `userId`     | ObjectId | yes      | References `users._id`                                                  |
| `europassCv` | Object   | yes      | The **AI version** of the Europass CV, see below (Mixed; shape guaranteed by `normalizeEuropassCv()` + `postCheck()`). Never changed by user edits |
| `editedCv`   | Object   | no       | The user's **saved inline edits** (same shape), or `null` = show the AI version. Set by `PUT …/improved`; cleared by "Reset to AI version" and by regenerating |
| `editedAt`   | Date     | no       | Time of the last saved edit (`null` if not edited)                      |
| `changes`    | Array    | no       | Improvement report, see below                                           |
| `createdAt`  | Date     | auto     | Time of the latest (re)generation                                       |

The CV shown, printed and used for the cover letter is `editedCv ?? europassCv` (model method `currentCv()`).

#### Embedded `europassCv` / `editedCv` document

Same shape as the `EuropassCv` TypeScript type. Text may contain placeholders in square brackets
(e.g. `"[Add your phone number]"`) where the original resume did not contain the information.
Besides the prompt rules, `postCheck()` in `europassService.js` enforces these rules in code:

| Rule | Example |
|------|---------|
| No numbers that are not in the original resume (others → placeholder + entry in `changes`) | "by 40%" → "by [Add a measurable result, e.g. X%]" |
| All dates `MM/YYYY` (`YYYY` if the month is unknown) | "November 30, 2024" → "11/2024" |
| Ongoing degree shows the expected graduation date | "2022 – Current" → "2022 – Expected 08/2026" or "[Expected graduation date]" |
| "Current" only if the resume says Present/Current/Ongoing | otherwise "[Add end date MM/YYYY]" |
| Country-specific qualifications written in full | "H.S.C : Science" → "Higher Secondary Certificate (HSC) – Science" |
| EQF level per education entry | SSC 3 · HSC 4 · Bachelor 6 · Master 7 · PhD 8 · trainings "" |
| Grades with their scale | "4.67" → "GPA 4.67 / 5.00" (SSC/HSC), "3.45" → "CGPA 3.45 / 4.00" (university) |
| Field of study not repeated when it is in the degree title | — |
| City/country not repeated in the employer/institution name | "Final Touch, Bangladesh" → "Final Touch" |
| Phone with readable spacing | "+8801846650807" → "+880 1846 650807" |

```jsonc
{
  "personalInfo":   { "fullName", "email", "phone", "address", "linkedin", "github", "website" },  // strings
  "aboutMe":        "…",
  "workExperience": [ { "startDate", "endDate" /* or "Current" */, "jobTitle", "employer", "city", "country",
                        "responsibilities": ["…"] } ],
  "education":      [ { "startDate", "endDate", "qualification", "institution", "city", "country",
                        "fieldOfStudy", "grade", "eqfLevel" /* "3"…"8" or "" */ } ],
  "languageSkills": { "motherTongue": ["…"],
                      "otherLanguages": [ { "language", "listening", "reading", "spokenProduction",
                                            "spokenInteraction", "writing" } ] },        // CEFR A1–C2
  "digitalSkills":  ["…"],
  "projects":       [ { "name", "description", "technologies": ["…"], "link" } ],
  "certifications": [ { "name", "issuer", "date" } ],
  "communicationSkills": "…", "organisationalSkills": "…",
  "volunteering":   ["…"],
  "references":     "…"
}
```

#### Embedded `changes` array (the "What we improved" report)

| Field      | Type   | Notes                                                              |
|------------|--------|--------------------------------------------------------------------|
| `section`  | String | Europass section, e.g. "Work Experience"                           |
| `category` | String | Enum: `ATS`, `toneAndStyle`, `content`, `structure`, `skills`      |
| `before`   | String | Original text, or `"(missing)"`                                    |
| `after`    | String | New text as it appears in the CV                                   |
| `reason`   | String | Which feedback tip / job requirement it addresses                  |

`coverLetter` is a Mongoose **virtual populate** on `improvedresumes` (`justOne`): the API includes
`coverLetter: { id, improvedResumeId, updatedAt }` so the frontend can show "Generate" or "View Cover Letter".
Regenerating the improved resume keeps its `_id` (`findOneAndReplace`), so an existing letter stays linked.

### 2.5 `coverletters` (Mongoose model `CoverLetter`)

**Implements `cover_letter_text` from the original ERD** (`CAREER_COPILOT_ASSESSMENT`). A cover letter
written from the improved Europass resume and the job details.

| Field              | Type     | Required | Constraints / notes                                                    |
|--------------------|----------|----------|------------------------------------------------------------------------|
| `_id`              | ObjectId | auto     | Primary key                                                            |
| `improvedResumeId` | ObjectId | yes      | References `improvedresumes._id`, **unique** (one letter per improved resume) |
| `analysisId`       | ObjectId | yes      | References `analyses._id`, **unique** (lookup by the URL's analysis id) |
| `userId`           | ObjectId | yes      | References `users._id`                                                 |
| `inputs`           | Object   | yes      | `{ hiringManagerName (≤100), companyAddress (≤300), jobSource (≤100), tone: "formal" \| "modern" }` |
| `letter`           | Object   | yes      | The generated letter, see below (Mixed; shape guaranteed by `assembleLetter()`) |
| `editedText`       | String   | no       | The user's own edited version (plain text, ≤ 8000 chars). `null` = use `letter` |
| `createdAt`        | Date     | auto     | Time of the latest (re)generation                                      |
| `updatedAt`        | Date     | auto     | Time of the last edit                                                  |

#### Embedded `letter` document

```jsonc
{
  "sender":     { "fullName", "email", "phone", "address", "linkedin" },   // copied from europassCv.personalInfo
  "date":       "11 October 2026",
  "recipient":  { "name", "title": "Hiring Manager", "company", "address" }, // "[Company address]" if unknown
  "subject":    "Application for Junior Frontend Developer Position",
  "salutation": "Dear Ms. Rahman,",          // or "Dear Hiring Manager,"
  "opening":    "…",                         // AI: position + where it was found + hook
  "body":       ["…", "…"],                  // AI: matching achievements; why this company
  "closing":    "…",                         // AI: interview request, attached CV, thanks
  "signOff":    "Yours sincerely,",          // or "Kind regards," when no name is known
  "signatureName": "Demo Student",
  "wordCount":  304,                         // words in opening + body + closing (target 250–400)
  "highlights": [ { "jobRequirement": "React", "resumeEvidence": "Designed reusable React components…",
                    "cvSection": "Work Experience" } ]        // shown as "Why this letter works"
}
```

Only `opening`, `body`, `closing` and `highlights` come from Gemini. Sender, date, recipient, subject,
salutation, sign-off and word count are filled in by code, so the formatting rules always hold.

---

## 3. Indexes

| Collection | Index                          | Type   | Why                                                   |
|------------|--------------------------------|--------|-------------------------------------------------------|
| `users`    | `{ email: 1 }`                 | unique | Login lookup; prevents duplicate accounts             |
| `users`    | `{ username: 1 }`              | unique | Prevents duplicate usernames                          |
| `resumes`  | `{ userId: 1 }`                | normal | Ownership checks                                      |
| `resumes`  | `{ userId: 1, uploadDate: -1 }`| compound | History page: "my resumes, newest first"            |
| `analyses` | `{ resumeId: 1 }`              | normal | Load all analyses of a resume (virtual populate)      |
| `analyses` | `{ userId: 1 }`                | normal | Ownership checks / delete all data of a user          |
| `improvedresumes` | `{ analysisId: 1 }`     | unique | One improved resume per analysis; fast lookup         |
| `improvedresumes` | `{ resumeId: 1 }`       | normal | Cascade delete when a resume is deleted               |
| `improvedresumes` | `{ userId: 1 }`         | normal | Ownership checks                                      |
| `coverletters` | `{ improvedResumeId: 1 }`  | unique | One cover letter per improved resume                  |
| `coverletters` | `{ analysisId: 1 }`        | unique | Lookup from the URL; cascade delete                   |
| `coverletters` | `{ userId: 1 }`            | normal | Ownership checks                                      |

Mongoose creates these automatically on startup (`autoIndex`). You can see them in Atlas under
**Browse Collections → (collection) → Indexes**.

---

## 4. Example documents

```json
// users
{
  "_id": { "$oid": "66f1a2b3c4d5e6f708192a3b" },
  "username": "demo_student",
  "email": "demo@resumind.dev",
  "passwordHash": "$2b$10$LfqMD35PaZ56Yrm61VxXn.Zl.n47.CJ/OqMO22vvBOh1FUplzJZE2",
  "createdAt": { "$date": "2026-07-01T09:58:00.000Z" }
}

// resumes
{
  "_id": { "$oid": "66f1a2b3c4d5e6f708192a3c" },
  "userId": { "$oid": "66f1a2b3c4d5e6f708192a3b" },
  "fileId": { "$oid": "66f1a2b3c4d5e6f708192a50" },
  "imageId": { "$oid": "66f1a2b3c4d5e6f708192a51" },
  "originalName": "demo-resume.pdf",
  "fileSize": 1661,
  "uploadDate": { "$date": "2026-07-01T10:00:00.000Z" }
}

// analyses
{
  "_id": { "$oid": "66f1a2b3c4d5e6f708192a3d" },
  "resumeId": { "$oid": "66f1a2b3c4d5e6f708192a3c" },
  "userId": { "$oid": "66f1a2b3c4d5e6f708192a3b" },
  "companyName": "Google",
  "jobTitle": "Junior Frontend Developer",
  "jobDescription": "We are looking for a Junior Frontend Developer with strong skills in React…",
  "feedback": { "overallScore": 72, "ATS": { "score": 78, "tips": [ … ] }, "…": "…" },
  "createdAt": { "$date": "2026-07-01T10:01:30.000Z" }
}

// improvedresumes
{
  "_id": { "$oid": "66f1a2b3c4d5e6f708192a3e" },
  "analysisId": { "$oid": "66f1a2b3c4d5e6f708192a3d" },
  "resumeId": { "$oid": "66f1a2b3c4d5e6f708192a3c" },
  "userId": { "$oid": "66f1a2b3c4d5e6f708192a3b" },
  "europassCv": {
    "personalInfo": { "fullName": "Demo Student", "email": "demo@resumind.dev", "phone": "[Add your phone number]", "…": "…" },
    "aboutMe": "Junior Frontend Developer with hands-on experience in React, TypeScript and Tailwind CSS…",
    "languageSkills": { "motherTongue": ["[Add your mother tongue]"], "otherLanguages": [ … ] },
    "…": "…"
  },
  "changes": [
    { "section": "About Me", "category": "toneAndStyle", "before": "(missing)",
      "after": "Junior Frontend Developer with hands-on experience…",
      "reason": "Added a professional summary in implied first person (tone tip: avoid \"I am\")." }
  ],
  "createdAt": { "$date": "2026-07-01T10:05:00.000Z" }
}

// coverletters
{
  "_id": { "$oid": "66f1a2b3c4d5e6f708192a3f" },
  "improvedResumeId": { "$oid": "66f1a2b3c4d5e6f708192a3e" },
  "analysisId": { "$oid": "66f1a2b3c4d5e6f708192a3d" },
  "userId": { "$oid": "66f1a2b3c4d5e6f708192a3b" },
  "inputs": { "hiringManagerName": "", "companyAddress": "1600 Amphitheatre Parkway, Mountain View, USA",
              "jobSource": "the Google Careers website", "tone": "formal" },
  "letter": {
    "sender": { "fullName": "Demo Student", "email": "demo@resumind.dev", "phone": "[Add your phone number]", "…": "…" },
    "date": "1 July 2026",
    "recipient": { "name": "", "title": "Hiring Manager", "company": "Google", "address": "1600 Amphitheatre Parkway, …" },
    "subject": "Application for Junior Frontend Developer Position",
    "salutation": "Dear Hiring Manager,",
    "opening": "Discovering the Junior Frontend Developer opening through the Google Careers website…",
    "body": [ "During my recent Frontend Intern position…", "Contributing to [Mention something specific about Google]…" ],
    "closing": "I would appreciate the opportunity to discuss…",
    "signOff": "Kind regards,", "signatureName": "Demo Student", "wordCount": 304,
    "highlights": [ { "jobRequirement": "React", "resumeEvidence": "…", "cvSection": "Work Experience" } ]
  },
  "editedText": null,
  "createdAt": { "$date": "2026-07-01T10:08:00.000Z" },
  "updatedAt": { "$date": "2026-07-01T10:08:00.000Z" }
}
```

The full sample data used by the seed script is in [`sample-data.json`](sample-data.json).

---

## 5. Seeding

```bash
cd backend
npm run seed      # runs ../database/seed.js with backend/.env
```

This creates the demo account **demo@resumind.dev / Demo@1234** with one resume (a generated PDF +
preview image, both stored in GridFS), one analysis, one improved Europass resume and one cover letter.
Running it again replaces the old demo data.
