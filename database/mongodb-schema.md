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
│ email        │            │ filePath     │            │ userId (FK)  │
│ passwordHash │            │ imagePath    │            │ companyName  │
│ createdAt    │            │ originalName │            │ jobTitle     │
└──────────────┘            │ fileSize     │            │ jobDescription│
        │                   │ uploadDate   │            │ feedback {…} │
        │                   └──────────────┘            │ createdAt    │
        │ 1                                    N        └──────────────┘
        └───────────────────────────────────────────────────────▲
```

- **User 1 : N Resume** — a user can upload many resumes (`resumes.userId → users._id`).
- **Resume 1 : N Analysis** — the same resume can be analyzed against many jobs (`analyses.resumeId → resumes._id`).
- `analyses.userId` is a deliberate **denormalization**: it lets the API check ownership and list a
  user's analyses with one query, without a join through `resumes`.

MongoDB has no foreign-key constraints, so the relationships are enforced by the application:
every resume/analysis query filters by the logged-in user's id, and deleting a resume also deletes
its analyses and its files (see `deleteResume` in `resumeController.js`).

---

## 2. Collections

### 2.1 `users`

| Field          | Type     | Required | Constraints / notes                                       |
|----------------|----------|----------|-----------------------------------------------------------|
| `_id`          | ObjectId | auto     | Primary key                                               |
| `username`     | String   | yes      | Unique, trimmed, 3–30 chars, letters/numbers/`_`/`.`      |
| `email`        | String   | yes      | Unique, stored lowercase                                  |
| `passwordHash` | String   | yes      | bcrypt hash (10 salt rounds). `select: false` — never returned by the API |
| `createdAt`    | Date     | auto     | Set by Mongoose `timestamps`                              |

### 2.2 `resumes`

| Field          | Type     | Required | Constraints / notes                                              |
|----------------|----------|----------|------------------------------------------------------------------|
| `_id`          | ObjectId | auto     | Primary key                                                      |
| `userId`       | ObjectId | yes      | References `users._id`                                           |
| `filePath`     | String   | yes      | PDF location relative to `backend/`, e.g. `uploads/1720…-ab12.pdf` |
| `imagePath`    | String   | no       | PNG preview of page 1 (made in the browser with pdf.js), or `null` |
| `originalName` | String   | yes      | File name the user uploaded (max 255)                            |
| `fileSize`     | Number   | yes      | Bytes (max 10 MB by default)                                     |
| `uploadDate`   | Date     | auto     | Defaults to now                                                  |

The API never exposes `filePath`/`imagePath`. Instead it returns the virtual fields
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
  "filePath": "uploads/1782900000000-seed-resume.pdf",
  "imagePath": "uploads/1782900000000-seed-resume.png",
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
```

The full sample data used by the seed script is in [`sample-data.json`](sample-data.json).

---

## 5. Seeding

```bash
cd backend
npm run seed      # runs ../database/seed.js with backend/.env
```

This creates the demo account **demo@resumind.dev / Demo@1234** with one resume (a generated PDF +
preview image in `backend/uploads/`) and one analysis. Running it again replaces the old demo data.
