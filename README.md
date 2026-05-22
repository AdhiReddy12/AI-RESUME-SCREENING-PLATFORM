# 🤖 Smart Resume Screening Platform

AI-powered resume screening with Spring Boot, FastAPI, React, and PostgreSQL.

## Quick Start

```bash
# Clone the repo, then:
docker-compose up -d --build

# Access
# Frontend:    http://localhost:3000
# Backend API: http://localhost:8080/api
# AI Service:  http://localhost:8000
# Swagger UI:  http://localhost:8080/api/swagger-ui.html

# Default login
#   Email:    hr@resumeai.com
#   Password: password
```

## Local Development (no Docker)

### 1. PostgreSQL
```bash
createdb resume_screening
psql resume_screening < database/schema.sql
```

### 2. Python AI Service
```bash
cd ai-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Spring Boot Backend
```bash
cd backend
# Edit src/main/resources/application.properties if needed
mvn spring-boot:run
```

### 4. Frontend
```bash
cd frontend
npx serve . -p 3000
# or just open index.html in a browser
```

## Architecture

```
React (3000)  →  Spring Boot (8080)  →  PostgreSQL (5432)
                        ↓
                 Python AI (8000)
                 PyMuPDF + python-docx
                 AIML pattern matching
```

## Scoring Algorithm

```
Overall = Skills×0.40 + Experience×0.30 + Education×0.15 + Keywords×0.15

Skills:     required match (70%) + preferred match (30%)
Experience: years vs min requirement, capped at 100
Education:  PhD=1.0, Masters=0.9, Bachelors=0.8, Diploma=0.6
Keywords:   JD keyword density × 150, capped at 100
```
