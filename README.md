# 🇫🇷 AI-Powered French Interview Assistant

An automated interview and language-assessment pipeline that fully replaces a human HR agent for first-round call-center screenings. Candidates are interviewed by an AI voice assistant, their spoken answers are transcribed and evaluated in real time, and a scored report lands in the recruiter's inbox before the candidate has even left the call.

Built to solve a very real bottleneck: an HR team manually running French-proficiency interviews for every call-center candidate, one by one. This system removes that step entirely.

## What it does

1. A candidate starts an interview session through the web app.
2. The AI assistant asks a series of questions (French-language, role-specific).
3. The candidate answers by voice — audio is captured and sent for transcription.
4. Answers are transcribed via OpenAI's transcription models and evaluated for French proficiency and content accuracy.
5. Once the interview ends, a scored report is automatically emailed to HR — no manual review, transcription, or grading required.

**Impact:** eliminates 100% of the HR time previously spent conducting first-round French proficiency interviews. HR's role shrinks to reviewing a finished report in their inbox.

## Architecture

```
Candidate (browser)
      │
      ▼
Angular front-end  ──────►  Spring Boot backend  ──────►  Supabase (candidate & interview data)
      │                            │
      │                            ▼
      │                    n8n workflows
      │                    ├─ Audio → OpenAI transcription
      │                    ├─ Answer validation / scoring (LLM)
      │                    └─ Automated email report to HR
      ▼
  Interview UI (question flow, recording, session state)
```

- **Frontend** (`french-ai-front/`) — Angular app handling the interview UI: question flow, audio recording, and candidate session state.
- **Backend** (`french_voice_ai/`) — Spring Boot service exposing REST APIs for interview creation and candidate data (backed by Supabase), and serving as the integration point for n8n.
- **Workflow layer** (`French_Test.json`) — n8n workflow(s) handling transcription (OpenAI), automated answer verification/scoring, and sending the results email to HR.
- **Database** — Supabase, storing candidates, interview sessions, and results.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular |
| Backend | Spring Boot (Java) |
| Database | Supabase |
| Orchestration | n8n |
| Transcription | OpenAI transcription models |
| Answer evaluation | LLM-based scoring via n8n |
| Deployment | Docker Compose (frontend, backend, MySQL) |

## Running locally

The project ships with a `docker-compose.yml` that spins up the full stack:

```bash
docker-compose up --build
```

This starts:
- `frontend` — Angular app (served on `localhost:4200`)
- `backend` — Spring Boot API (`localhost:8080`)
- `mysql-db` — MySQL 8.0 instance

> Note: the n8n workflow (`French_Test.json`) runs separately — import it into your own n8n instance and configure it with your OpenAI API key and SMTP credentials for the HR report emails.

### Environment variables

The backend expects a database connection (configured via `SPRING_DATASOURCE_*` in `docker-compose.yml`). The n8n workflow requires:
- An OpenAI API key (transcription + scoring)
- SMTP or email service credentials (sending the HR report)
- Backend API base URL (for pulling/pushing candidate data)

## Roadmap

- Automated candidate approval/rejection flow, with the accept/reject email triggered directly from the scoring result
- Multi-language support beyond French
- Richer scoring rubric (tone, hesitation, fluency, not just correctness)

## Status

Functional end-to-end prototype, demoed live with real interview sessions. Currently used as a proof of concept for eliminating manual first-pass language screening in recruitment.
