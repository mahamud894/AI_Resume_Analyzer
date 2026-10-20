-- =====================================================================
--  AI Resume Analyzer (CSE4204-8A-T05) — Relational schema
-- ---------------------------------------------------------------------
--  NOTE: The LIVE system uses MongoDB Atlas (see mongodb-schema.md and
--  backend/src/models). This file is the relational equivalent of the
--  same ERD, written for academic documentation only. It is not used
--  by the application.
--
--  Relationships:  users 1 ── N resumes 1 ── N analyses 1 ── 0..1 improved_resumes
--                  improved_resumes 1 ── N improvement_changes
--                  improved_resumes 1 ── 0..1 cover_letters
--  cover_letters implements CAREER_COPILOT_ASSESSMENT.cover_letter_text from the original ERD.
--  Dialect: standard SQL, compatible with MySQL 8 and PostgreSQL
--  (both support the JSON column type).
-- =====================================================================

DROP TABLE IF EXISTS cover_letters;
DROP TABLE IF EXISTS improvement_changes;
DROP TABLE IF EXISTS improved_resumes;
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS resumes;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id             CHAR(24)      NOT NULL,            -- MongoDB ObjectId (hex)
    username       VARCHAR(30)   NOT NULL,
    email          VARCHAR(255)  NOT NULL,
    password_hash  VARCHAR(100)  NOT NULL,            -- bcrypt hash, never plain text
    password_changed_at TIMESTAMP NULL,               -- tokens issued before this are rejected
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_users          PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email)
);

-- ---------------------------------------------------------------------
-- RESUMES  (one user has many resumes)
-- ---------------------------------------------------------------------
CREATE TABLE resumes (
    id             CHAR(24)      NOT NULL,
    user_id        CHAR(24)      NOT NULL,
    file_path      VARCHAR(500)  NOT NULL,            -- e.g. uploads/1720000000000-ab12.pdf
    image_path     VARCHAR(500)  NULL,                -- PNG preview of page 1
    original_name  VARCHAR(255)  NOT NULL,
    file_size      INTEGER       NOT NULL,            -- bytes
    upload_date    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_resumes      PRIMARY KEY (id),
    CONSTRAINT fk_resumes_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_resumes_size CHECK (file_size > 0)
);

CREATE INDEX idx_resumes_user_date ON resumes (user_id, upload_date DESC);

-- ---------------------------------------------------------------------
-- ANALYSES  (one resume has many analyses)
-- ---------------------------------------------------------------------
CREATE TABLE analyses (
    id               CHAR(24)      NOT NULL,
    resume_id        CHAR(24)      NOT NULL,
    user_id          CHAR(24)      NOT NULL,          -- denormalized for fast ownership checks
    company_name     VARCHAR(100)  NULL,
    job_title        VARCHAR(100)  NOT NULL,
    job_description  TEXT          NOT NULL,
    overall_score    SMALLINT      NOT NULL,          -- copied out of feedback for sorting/filtering
    feedback         JSON          NOT NULL,          -- {overallScore, ATS, toneAndStyle, content, structure, skills}
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_analyses        PRIMARY KEY (id),
    CONSTRAINT fk_analyses_resume FOREIGN KEY (resume_id)
        REFERENCES resumes (id) ON DELETE CASCADE,
    CONSTRAINT fk_analyses_user   FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_analyses_score  CHECK (overall_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_analyses_resume ON analyses (resume_id);
CREATE INDEX idx_analyses_user   ON analyses (user_id);

-- ---------------------------------------------------------------------
-- IMPROVED_RESUMES  (one analysis has at most one improved Europass CV)
-- In MongoDB the CV and the change list are embedded in one document;
-- relationally the CV stays a JSON column and the change list becomes
-- its own table (1 : N).
-- ---------------------------------------------------------------------
CREATE TABLE improved_resumes (
    id           CHAR(24)   NOT NULL,
    analysis_id  CHAR(24)   NOT NULL,                 -- UNIQUE → 1 : 0..1 with analyses
    resume_id    CHAR(24)   NOT NULL,
    user_id      CHAR(24)   NOT NULL,
    europass_cv  JSON       NOT NULL,                 -- AI version: {personalInfo, aboutMe, workExperience[], education[ {…, eqfLevel} ], languageSkills, ...}
    edited_cv    JSON       NULL,                     -- the user's saved inline edits (same shape); NULL = use europass_cv
    edited_at    TIMESTAMP  NULL,                     -- time of the last saved edit
    created_at   TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,   -- time of the latest (re)generation

    CONSTRAINT pk_improved_resumes          PRIMARY KEY (id),
    CONSTRAINT uq_improved_resumes_analysis UNIQUE (analysis_id),
    CONSTRAINT fk_improved_analysis FOREIGN KEY (analysis_id)
        REFERENCES analyses (id) ON DELETE CASCADE,
    CONSTRAINT fk_improved_resume   FOREIGN KEY (resume_id)
        REFERENCES resumes (id) ON DELETE CASCADE,
    CONSTRAINT fk_improved_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_improved_resume ON improved_resumes (resume_id);
CREATE INDEX idx_improved_user   ON improved_resumes (user_id);

-- ---------------------------------------------------------------------
-- IMPROVEMENT_CHANGES  (the "What we improved" report of an improved resume)
-- ---------------------------------------------------------------------
CREATE TABLE improvement_changes (
    id                  INTEGER       NOT NULL,
    improved_resume_id  CHAR(24)      NOT NULL,
    position            SMALLINT      NOT NULL,       -- keeps the original order of the report
    section             VARCHAR(100)  NOT NULL,
    category            VARCHAR(20)   NOT NULL,
    before_text         TEXT          NOT NULL,
    after_text          TEXT          NOT NULL,
    reason              TEXT          NOT NULL,

    CONSTRAINT pk_improvement_changes PRIMARY KEY (id),
    CONSTRAINT fk_changes_improved FOREIGN KEY (improved_resume_id)
        REFERENCES improved_resumes (id) ON DELETE CASCADE,
    CONSTRAINT ck_changes_category CHECK (category IN ('ATS', 'toneAndStyle', 'content', 'structure', 'skills'))
);

CREATE INDEX idx_changes_improved ON improvement_changes (improved_resume_id, position);

-- ---------------------------------------------------------------------
-- COVER_LETTERS  (one per improved resume)
-- Implements `cover_letter_text` of CAREER_COPILOT_ASSESSMENT (original ERD):
--   cover_letter_text = the generated letter, edited_text = the user's own version.
-- ---------------------------------------------------------------------
CREATE TABLE cover_letters (
    id                   CHAR(24)      NOT NULL,
    improved_resume_id   CHAR(24)      NOT NULL,      -- UNIQUE → 1 : 0..1 with improved_resumes
    analysis_id          CHAR(24)      NOT NULL,      -- UNIQUE as well (one improved resume per analysis)
    user_id              CHAR(24)      NOT NULL,
    hiring_manager_name  VARCHAR(100)  NULL,
    company_address      VARCHAR(300)  NULL,
    job_source           VARCHAR(100)  NULL,
    tone                 VARCHAR(10)   NOT NULL DEFAULT 'formal',
    letter               JSON          NOT NULL,      -- {sender, date, recipient, subject, salutation, opening, body[], closing, signOff, signatureName, wordCount, highlights[]}
    cover_letter_text    TEXT          NOT NULL,      -- the generated letter as plain text (ERD field)
    edited_text          TEXT          NULL,          -- the user's edited version (max 8000 chars in the app)
    word_count           SMALLINT      NOT NULL,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_cover_letters          PRIMARY KEY (id),
    CONSTRAINT uq_cover_letters_improved UNIQUE (improved_resume_id),
    CONSTRAINT uq_cover_letters_analysis UNIQUE (analysis_id),
    CONSTRAINT fk_letter_improved FOREIGN KEY (improved_resume_id)
        REFERENCES improved_resumes (id) ON DELETE CASCADE,
    CONSTRAINT fk_letter_analysis FOREIGN KEY (analysis_id)
        REFERENCES analyses (id) ON DELETE CASCADE,
    CONSTRAINT fk_letter_user     FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_letter_tone     CHECK (tone IN ('formal', 'modern'))
);

CREATE INDEX idx_cover_letters_user ON cover_letters (user_id);

-- ---------------------------------------------------------------------
-- SAMPLE DATA (same as database/sample-data.json)
-- password_hash below is bcrypt("Demo@1234")
-- ---------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, created_at) VALUES
('66f1a2b3c4d5e6f708192a3b', 'demo_student', 'demo@resumind.dev',
 '$2b$10$LfqMD35PaZ56Yrm61VxXn.Zl.n47.CJ/OqMO22vvBOh1FUplzJZE2', '2026-07-01 09:58:00');

INSERT INTO resumes (id, user_id, file_path, image_path, original_name, file_size, upload_date) VALUES
('66f1a2b3c4d5e6f708192a3c', '66f1a2b3c4d5e6f708192a3b',
 'uploads/1782900000000-seed-resume.pdf', 'uploads/1782900000000-seed-resume.png',
 'demo-resume.pdf', 1661, '2026-07-01 10:00:00');

INSERT INTO analyses (id, resume_id, user_id, company_name, job_title, job_description, overall_score, feedback, created_at) VALUES
('66f1a2b3c4d5e6f708192a3d', '66f1a2b3c4d5e6f708192a3c', '66f1a2b3c4d5e6f708192a3b',
 'Google', 'Junior Frontend Developer',
 'We are looking for a Junior Frontend Developer with strong skills in React, TypeScript and CSS.',
 72,
 '{"overallScore":72,"ATS":{"score":78,"tips":[{"type":"good","tip":"Clear section headings that ATS can parse"}]},"toneAndStyle":{"score":75,"tips":[]},"content":{"score":65,"tips":[]},"structure":{"score":80,"tips":[]},"skills":{"score":70,"tips":[]}}',
 '2026-07-01 10:01:30');

INSERT INTO improved_resumes (id, analysis_id, resume_id, user_id, europass_cv, created_at) VALUES
('66f1a2b3c4d5e6f708192a3e', '66f1a2b3c4d5e6f708192a3d', '66f1a2b3c4d5e6f708192a3c', '66f1a2b3c4d5e6f708192a3b',
 '{"personalInfo":{"fullName":"Demo Student","email":"demo@resumind.dev","phone":"[Add your phone number]","address":"Khulna, Bangladesh","linkedin":"","github":"https://github.com/demo-student","website":""},"aboutMe":"Junior Frontend Developer with hands-on experience in React, TypeScript and Tailwind CSS.","workExperience":[],"education":[],"languageSkills":{"motherTongue":["[Add your mother tongue]"],"otherLanguages":[]},"digitalSkills":["Frontend: React, TypeScript, JavaScript, Tailwind CSS"],"projects":[],"certifications":[],"communicationSkills":"","organisationalSkills":"","volunteering":[],"references":"Available upon request"}',
 '2026-07-01 10:05:00');

INSERT INTO improvement_changes (id, improved_resume_id, position, section, category, before_text, after_text, reason) VALUES
(1, '66f1a2b3c4d5e6f708192a3e', 1, 'About Me', 'toneAndStyle', '(missing)',
 'Junior Frontend Developer with hands-on experience in React, TypeScript and Tailwind CSS.',
 'Added a professional summary in implied first person (tone tip: avoid "I am").'),
(2, '66f1a2b3c4d5e6f708192a3e', 2, 'Work Experience', 'content', '(missing)',
 '[Add a measurable result, e.g. number of components built or bugs fixed]',
 'Content tip asks to quantify achievements; no numbers exist in the resume, so a placeholder asks for one.');

INSERT INTO cover_letters (id, improved_resume_id, analysis_id, user_id, hiring_manager_name, company_address, job_source,
                           tone, letter, cover_letter_text, edited_text, word_count, created_at, updated_at) VALUES
('66f1a2b3c4d5e6f708192a3f', '66f1a2b3c4d5e6f708192a3e', '66f1a2b3c4d5e6f708192a3d', '66f1a2b3c4d5e6f708192a3b',
 NULL, '1600 Amphitheatre Parkway, Mountain View, USA', 'the Google Careers website', 'formal',
 '{"subject":"Application for Junior Frontend Developer Position","salutation":"Dear Hiring Manager,","signOff":"Kind regards,","wordCount":304}',
 'Dear Hiring Manager,

Discovering the Junior Frontend Developer opening through the Google Careers website immediately captured my professional interest ...

Kind regards,
Demo Student',
 NULL, 304, '2026-07-01 10:08:00', '2026-07-01 10:08:00');

-- ---------------------------------------------------------------------
-- USEFUL QUERIES
-- ---------------------------------------------------------------------
-- A user's history, newest first (what GET /api/resume returns):
--   SELECT r.id, r.original_name, a.company_name, a.job_title, a.overall_score, a.created_at
--   FROM resumes r LEFT JOIN analyses a ON a.resume_id = r.id
--   WHERE r.user_id = '66f1a2b3c4d5e6f708192a3b'
--   ORDER BY r.upload_date DESC, a.created_at DESC;
--
-- The "What we improved" report of one analysis, grouped by category:
--   SELECT c.category, c.section, c.before_text, c.after_text, c.reason
--   FROM improved_resumes ir JOIN improvement_changes c ON c.improved_resume_id = ir.id
--   WHERE ir.analysis_id = '66f1a2b3c4d5e6f708192a3d'
--   ORDER BY c.category, c.position;
--
-- The CV to show/print (the user's saved edits win over the AI version):
--   SELECT COALESCE(edited_cv, europass_cv) AS cv FROM improved_resumes
--   WHERE analysis_id = '66f1a2b3c4d5e6f708192a3d';
--
-- The text to show/print for a cover letter (the user's edit wins over the generated text):
--   SELECT COALESCE(edited_text, cover_letter_text) AS letter_text, word_count, tone
--   FROM cover_letters WHERE analysis_id = '66f1a2b3c4d5e6f708192a3d';
