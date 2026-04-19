# TwinMind AI Copilot

A real-time meeting assistant built for the TwinMind assignment. It handles live transcription, context-aware suggestions, and detailed chat insights.

## Quick Start

### 1. Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install django djangorestframework django-cors-headers groq
python manage.py runserver
```

### 2. Frontend
```bash
cd frontend
npm install && npm run dev
```

Paste your Groq API key in the **Settings** (⚙️) to start.

## How it works
- **Transcription**: Uses Groq's **Whisper Large V3**. I implemented a dual-track system: Web Speech API for real-time word-by-word feedback, and Whisper every 30s for high-accuracy finalized results.
- **LLM**: Powered by **GPT-OSS 120B**. It generates exactly 3 suggestions per chunk, focused on questions, talking points, and facts.
- **Robustness**: The backend uses fuzzy JSON extraction to handle any unexpected formatting from the large model, ensuring the UI cards never break.

## Key Decisions
- **Vanilla CSS**: Kept it lean and custom rather than using a heavy framework. 
- **30s Chunking**: Provides a good balance between context length and latency.
- **Dual-Transcription**: Solves the "delay" problem by showing live text while waiting for the more accurate Whisper results.
- **Export**: Full session history can be saved as JSON for review.
