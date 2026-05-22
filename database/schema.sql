-- Smart Resume Screening Platform - PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users / Auth
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    full_name      VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(1000),
    company_name   VARCHAR(255),
    contact_number VARCHAR(50),
    role           VARCHAR(50)  NOT NULL DEFAULT 'RECRUITER', -- RECRUITER
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    department          VARCHAR(255),
    description         TEXT,
    required_skills     TEXT,        -- comma-separated
    preferred_skills    TEXT,
    min_experience      INTEGER DEFAULT 0,
    education_level     VARCHAR(50) DEFAULT 'BACHELORS', -- DIPLOMA, BACHELORS, MASTERS, PHD
    keywords            TEXT,
    shortlist_threshold INTEGER DEFAULT 70,
    status              VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, DRAFT
    created_by          BIGINT REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Resumes
CREATE TABLE resumes (
    id            BIGSERIAL PRIMARY KEY,
    job_id        BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
    original_name VARCHAR(500) NOT NULL,
    stored_path   VARCHAR(1000) NOT NULL,
    file_type     VARCHAR(10) NOT NULL, -- PDF, DOCX
    file_size     BIGINT,
    uploaded_by   BIGINT REFERENCES users(id),
    uploaded_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Screening Results
CREATE TABLE screening_results (
    id                BIGSERIAL PRIMARY KEY,
    resume_id         BIGINT UNIQUE REFERENCES resumes(id) ON DELETE CASCADE,
    job_id            BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
    candidate_name    VARCHAR(255),
    candidate_email   VARCHAR(255),
    candidate_phone   VARCHAR(50),
    candidate_linkedin VARCHAR(500),
    skills_score      NUMERIC(5,2) DEFAULT 0,
    experience_score  NUMERIC(5,2) DEFAULT 0,
    education_score   NUMERIC(5,2) DEFAULT 0,
    keyword_score     NUMERIC(5,2) DEFAULT 0,
    overall_score     NUMERIC(5,2) DEFAULT 0,
    matched_skills    TEXT,         -- JSON array
    years_experience  NUMERIC(4,1),
    education_level   VARCHAR(50),
    ai_summary        TEXT,
    status            VARCHAR(50) NOT NULL DEFAULT 'SCREENED', -- SCREENED, SHORTLISTED, INTERVIEWED, OFFERED, HIRED, REJECTED
    screened_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_status           ON jobs(status);
CREATE INDEX idx_resumes_job_id        ON resumes(job_id);
CREATE INDEX idx_screening_job_id      ON screening_results(job_id);
CREATE INDEX idx_screening_score       ON screening_results(overall_score DESC);
CREATE INDEX idx_screening_status      ON screening_results(status);


