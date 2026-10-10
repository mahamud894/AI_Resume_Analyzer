-- =====================================================================
--  AI Resume Analyzer (CSE4204-8A-T05) — Relational schema
-- ---------------------------------------------------------------------
--  NOTE: The LIVE system uses MongoDB Atlas (see mongodb-schema.md and
--  backend/src/models). This file is the relational equivalent of the
--  same ERD, written for academic documentation only. It is not used
--  by the application.
--
--  Relationships:  users 1 ── N resumes 1 ── N analyses
--  Dialect: standard SQL, compatible with MySQL 8 and PostgreSQL
--  (both support the JSON column type).
-- =====================================================================

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

-- ---------------------------------------------------------------------
-- USEFUL QUERIES
-- ---------------------------------------------------------------------
-- A user's history, newest first (what GET /api/resume returns):
--   SELECT r.id, r.original_name, a.company_name, a.job_title, a.overall_score, a.created_at
--   FROM resumes r LEFT JOIN analyses a ON a.resume_id = r.id
--   WHERE r.user_id = '66f1a2b3c4d5e6f708192a3b'
--   ORDER BY r.upload_date DESC, a.created_at DESC;
