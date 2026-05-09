# NeuroDocX — AI-Powered PDF Intelligence Platform

> Chat with your PDFs using RAG, semantic search, and Groq LLM.

## Live Demo

- **Frontend**: https://neuro-doc-6kd29xc1s-pixel-pirates1.vercel.app
- **Backend API**: https://neurodocx-368778620053.europe-west1.run.app
- **API Docs**: https://neurodocx-368778620053.europe-west1.run.app/docs
- **GitHub**: https://github.com/pallaviXD/NeuroDocX

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Framer Motion
- **Backend**: FastAPI + Python 3.11 + SQLAlchemy + SQLite
- **AI**: Groq API (llama-3.3-70b) + Sentence Transformers + FAISS
- **Deployment**: Vercel (frontend) + Google Cloud Run (backend)

## Features

- AI PDF Chat with RAG pipeline and source citations
- Semantic search with MMR retrieval (FAISS + all-MiniLM-L6-v2)
- Multi-PDF comparison and cross-document analysis
- Quiz generator (MCQ, True/False, Fill-in-blank) with AI evaluation
- Study notes and smart summaries (5 styles)
- Exam prep reports with downloadable PDF
- Progress tracking and analytics dashboard
- Voice assistant (speech-to-text + text-to-speech)
- Chat history with session persistence
- OCR support for scanned PDFs
- 5 explain modes (Standard, Beginner, Technical, Business, ELI5)
- Secure JWT authentication with password strength validation

## Setup

### Backend
```bash
cd neurodocx-backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd neurodocx
npm install
cp .env.example .env         # Set VITE_API_URL
npm run dev
```

## Environment Variables

### Backend `.env`
```
GROQ_API_KEY=your_key_here
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:8000
```
