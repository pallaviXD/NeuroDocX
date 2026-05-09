from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import text
from datetime import datetime
import uuid

DATABASE_URL = "sqlite:///./neurodocx.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    documents = relationship("Document", back_populates="owner", cascade="all, delete")
    sessions = relationship("ChatSession", back_populates="owner", cascade="all, delete")
    quiz_results = relationship("QuizResult", back_populates="owner", cascade="all, delete")
    summaries = relationship("Summary", back_populates="owner", cascade="all, delete")
    notes = relationship("Note", back_populates="owner", cascade="all, delete")
    analytics = relationship("Analytics", back_populates="owner", cascade="all, delete")


class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    pages = Column(Integer, default=0)
    file_size = Column(Integer, default=0)
    vectorstore_path = Column(String, nullable=True)
    has_ocr = Column(Boolean, default=False)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="documents")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New Chat")
    doc_ids = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete")


class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(Text, default="")
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    session = relationship("ChatSession", back_populates="messages")


class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    doc_ids = Column(Text, default="")
    quiz_content = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    total_questions = Column(Integer, default=0)
    difficulty = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="quiz_results")


class Summary(Base):
    __tablename__ = "summaries"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    doc_ids = Column(Text, default="")
    content = Column(Text, nullable=False)
    style = Column(String, default="detailed")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="summaries")


class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    doc_ids = Column(Text, default="")
    content = Column(Text, nullable=False)
    title = Column(String, default="Study Notes")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="notes")


class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    event_type = Column(String, nullable=False)  # chat, upload, quiz, summary, notes
    doc_id = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    tokens_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="analytics")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    # Safe migration: add new columns if they don't exist (SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS)
    with engine.connect() as conn:
        existing = [row[1] for row in conn.execute(text("PRAGMA table_info(documents)")).fetchall()]
        if "has_ocr" not in existing:
            conn.execute(text("ALTER TABLE documents ADD COLUMN has_ocr BOOLEAN DEFAULT 0"))
        if "chunk_count" not in existing:
            conn.execute(text("ALTER TABLE documents ADD COLUMN chunk_count INTEGER DEFAULT 0"))
        conn.commit()
