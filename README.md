# TwinMind Copilot

TwinMind Copilot is a full-stack meeting assistant built for a live-suggestions assignment. It captures spoken conversation, refines transcripts, and generates context-aware prompts and talking points during a session.

## What it does

- Captures live meeting audio context
- Combines low-latency browser speech recognition with higher-quality Whisper transcription
- Generates structured copilot suggestions with an LLM
- Persists session state through a Django backend
- Serves an interactive frontend through Vite

## Tech Stack

- Django
- Django REST Framework
- Vite
- JavaScript
- Groq
- Whisper-based transcription flow
- Render / Vercel deployment setup

## Repository Structure

- `backend/` - Django API, transcript processing, and deployment scripts
- `frontend/` - Vite-based UI for live meeting suggestions
- `TwinMind - Live Suggestions Assignment April 2026.pdf` - assignment brief

## Local Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Product Design Notes

- Uses a dual-transcription approach so the UI can feel live without sacrificing final transcript quality.
- LLM output is constrained into suggestion cards instead of open-ended chat for a clearer meeting-assistant experience.
- The frontend stays lightweight and responsive without introducing a large UI framework.

## Skills Demonstrated

- Full-stack application development
- Real-time UX design
- Speech-to-text integration
- LLM prompt orchestration
- API design and deployment packaging
