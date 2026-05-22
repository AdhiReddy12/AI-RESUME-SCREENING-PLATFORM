-- Smart Resume Screening Platform - PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users / Auth
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'RECRUITER', -- ADMIN, RECRUITER, HIRING_MANAGER
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
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

-- Seed data
INSERT INTO users (email, password, full_name, role) VALUES
  ('hr@resumeai.com',      '$2b$10$gqHI1FNH1WgDRL.fQweYEOOOqc9ZLyWV0qvSfnxWXjT0Dj9HM8nua', 'HR Admin',          'ADMIN'),
  ('recruiter@resumeai.com','$2b$10$gqHI1FNH1WgDRL.fQweYEOOOqc9ZLyWV0qvSfnxWXjT0Dj9HM8nua', 'Jane Recruiter',     'RECRUITER'),
  ('manager@resumeai.com',  '$2b$10$gqHI1FNH1WgDRL.fQweYEOOOqc9ZLyWV0qvSfnxWXjT0Dj9HM8nua', 'Bob Hiring Manager', 'HIRING_MANAGER');
-- password = "password" bcrypt

INSERT INTO jobs (title, department, description, required_skills, preferred_skills, min_experience, education_level, keywords, shortlist_threshold, status, created_by) VALUES
  ('Senior Java Developer', 'Engineering',
   'We are looking for an experienced Java developer to join our backend team.',
   'Java,Spring Boot,PostgreSQL,REST API',
   'Docker,Kubernetes,Redis,Kafka',
   4, 'BACHELORS',
   'microservices,agile,ci/cd,junit,maven',
   70, 'OPEN', 1),

  ('Python ML Engineer', 'Data Science',
   'Join our AI team to build and deploy machine learning models.',
   'Python,Machine Learning,TensorFlow,SQL',
   'PyTorch,FastAPI,Docker,AWS',
   3, 'MASTERS',
   'nlp,deep learning,transformers,pytorch,sklearn',
   75, 'OPEN', 1),

  ('React Frontend Developer', 'Engineering',
   'Build beautiful and performant web interfaces.',
   'React,JavaScript,HTML,CSS',
   'TypeScript,Redux,GraphQL,Jest',
   2, 'BACHELORS',
   'responsive design,accessibility,webpack,node.js',
   65, 'OPEN', 2);
