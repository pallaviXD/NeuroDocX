from dotenv import load_dotenv
load_dotenv()

import os
import logging

# On Railway/production: allow HuggingFace to download model on first start
# On local: use cached model (set TRANSFORMERS_OFFLINE=1 in local .env)
if os.getenv("TRANSFORMERS_OFFLINE") == "1":
    os.environ["HF_DATASETS_OFFLINE"] = "1"
    os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("neurodocx")

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.database import init_db, User
from app.auth import get_current_user
from app.routers import auth, documents, chat, analytics
from app.routers import exam as exam_router

app = FastAPI(
    title="NeuroDocX API",
    version="2.0.0",
    description="AI-Powered PDF Intelligence Platform",
)

# CORS — allow localhost dev + production frontend URL
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    ALLOWED_ORIGINS.append(frontend_url)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(exam_router.router)


@app.on_event("startup")
def startup():
    init_db()
    logger.info("NeuroDocX v2.0 backend started")


@app.get("/")
def root():
    return {"message": "NeuroDocX API v2.0 is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "created_at": current_user.created_at.isoformat(),
    }
