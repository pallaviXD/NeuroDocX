# NeuroDocX — AI-Powered PDF Intelligence Platform

Chat with your PDFs using RAG, semantic search, and Groq LLM.

## Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: FastAPI + Python
- **AI**: Groq API (llama-3.3-70b) + Sentence Transformers + FAISS
- **DB**: SQLite + SQLAlchemy

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

## Features
- AI PDF Chat with RAG pipeline
- Semantic search with FAISS
- Multi-PDF analysis & comparison
- Quiz generator with AI evaluation
- Study notes & summaries
- Exam prep reports with PDF download
- Voice assistant
- Chat history
- Progress tracking
