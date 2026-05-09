import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
from ..database import get_db, Document, ChatSession, Message, User, QuizResult, Summary, Note, Analytics
from ..auth import get_current_user
from ..rag import (
    chat_with_docs, generate_summary, generate_quiz,
    generate_notes, compare_documents, evaluate_quiz_answer
)

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    doc_ids: List[str]
    message: str
    explain_mode: str = "standard"


class SummaryRequest(BaseModel):
    doc_ids: List[str]
    style: str = "detailed"


class QuizRequest(BaseModel):
    doc_ids: List[str]
    num_questions: int = 5
    difficulty: str = "medium"
    quiz_type: str = "mcq"


class NotesRequest(BaseModel):
    doc_ids: List[str]


class CompareRequest(BaseModel):
    doc_ids: List[str]


class EvalRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    explanation: str


def _get_store_info(doc_ids: List[str], user_id: str, db: Session) -> tuple:
    """Returns (store_paths, doc_names_map)."""
    paths = []
    names = {}
    for doc_id in doc_ids:
        doc = db.query(Document).filter(
            Document.id == doc_id, Document.user_id == user_id
        ).first()
        if doc and doc.vectorstore_path:
            paths.append(doc.vectorstore_path)
            names[doc.vectorstore_path] = doc.original_name
    return paths, names


@router.post("/")
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if not store_paths:
        raise HTTPException(status_code=400, detail="No valid documents found. Please upload a PDF first.")

    # Get or create session
    session = None
    if req.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == req.session_id,
            ChatSession.user_id == current_user.id,
        ).first()

    if not session:
        session = ChatSession(
            user_id=current_user.id,
            title=req.message[:60] + ("..." if len(req.message) > 60 else ""),
            doc_ids=",".join(req.doc_ids),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Load history
    history_msgs = (
        db.query(Message)
        .filter(Message.session_id == session.id)
        .order_by(Message.created_at)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_msgs]

    # RAG
    result = chat_with_docs(
        query=req.message,
        store_paths=store_paths,
        chat_history=history,
        explain_mode=req.explain_mode,
        doc_names=doc_names,
    )

    # Persist messages
    db.add(Message(session_id=session.id, role="user", content=req.message))
    db.add(Message(
        session_id=session.id,
        role="assistant",
        content=result["answer"],
        sources=json.dumps(result["sources"]),
        tokens_used=result.get("tokens_used", 0),
    ))
    db.add(Analytics(
        user_id=current_user.id,
        event_type="chat",
        session_id=session.id,
        tokens_used=result.get("tokens_used", 0),
    ))
    db.commit()

    return {
        "session_id": session.id,
        "answer": result["answer"],
        "sources": result["sources"],
        "model": result.get("model", "llama-3.3-70b-versatile"),
        "tokens_used": result.get("tokens_used", 0),
    }


@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "title": s.title,
            "doc_ids": s.doc_ids.split(",") if s.doc_ids else [],
            "created_at": s.created_at.isoformat(),
            "message_count": len(s.messages),
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}/messages")
def get_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id, ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "sources": json.loads(m.sources) if m.sources else [],
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id, ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}


@router.post("/summarize")
def summarize(
    req: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if not store_paths:
        raise HTTPException(status_code=400, detail="No valid documents found.")

    content = generate_summary(store_paths, req.style, doc_names)

    # Save to DB
    summary = Summary(
        user_id=current_user.id,
        doc_ids=",".join(req.doc_ids),
        content=content,
        style=req.style,
    )
    db.add(summary)
    db.add(Analytics(user_id=current_user.id, event_type="summary"))
    db.commit()

    return {"summary": content, "id": summary.id, "style": req.style}


@router.post("/quiz")
def quiz(
    req: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if not store_paths:
        raise HTTPException(status_code=400, detail="No valid documents found.")

    result = generate_quiz(store_paths, req.num_questions, req.difficulty, req.quiz_type, doc_names)

    qr = QuizResult(
        user_id=current_user.id,
        doc_ids=",".join(req.doc_ids),
        quiz_content=json.dumps(result["questions"]),
        total_questions=result["total"],
        difficulty=req.difficulty,
    )
    db.add(qr)
    db.add(Analytics(user_id=current_user.id, event_type="quiz"))
    db.commit()

    return {
        "quiz_id": qr.id,
        "questions": result["questions"],
        "total": result["total"],
        "difficulty": req.difficulty,
        "type": req.quiz_type,
    }


@router.post("/quiz/evaluate")
def evaluate(req: EvalRequest, current_user: User = Depends(get_current_user)):
    result = evaluate_quiz_answer(
        req.question, req.user_answer, req.correct_answer, req.explanation
    )
    return result


@router.post("/quiz/{quiz_id}/score")
def save_score(
    quiz_id: str,
    score: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    qr = db.query(QuizResult).filter(
        QuizResult.id == quiz_id, QuizResult.user_id == current_user.id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qr.score = score
    db.commit()
    return {"message": "Score saved", "score": score}


@router.post("/notes")
def notes(
    req: NotesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if not store_paths:
        raise HTTPException(status_code=400, detail="No valid documents found.")

    content = generate_notes(store_paths, doc_names)

    note = Note(
        user_id=current_user.id,
        doc_ids=",".join(req.doc_ids),
        content=content,
    )
    db.add(note)
    db.add(Analytics(user_id=current_user.id, event_type="notes"))
    db.commit()

    return {"notes": content, "id": note.id}


@router.post("/compare")
def compare(
    req: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(req.doc_ids) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 documents to compare.")
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if len(store_paths) < 2:
        raise HTTPException(status_code=400, detail="Could not find 2 valid documents.")

    result = compare_documents(store_paths, doc_names)
    db.add(Analytics(user_id=current_user.id, event_type="compare"))
    db.commit()
    return {"comparison": result}


@router.get("/history/summaries")
def list_summaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(Summary)
        .filter(Summary.user_id == current_user.id)
        .order_by(Summary.created_at.desc())
        .limit(20)
        .all()
    )
    return [{"id": s.id, "style": s.style, "preview": s.content[:200], "created_at": s.created_at.isoformat()} for s in items]


@router.get("/history/notes")
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.created_at.desc())
        .limit(20)
        .all()
    )
    return [{"id": n.id, "title": n.title, "preview": n.content[:200], "created_at": n.created_at.isoformat()} for n in items]


@router.get("/history/quizzes")
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == current_user.id)
        .order_by(QuizResult.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": q.id,
            "total_questions": q.total_questions,
            "difficulty": q.difficulty,
            "score": q.score,
            "created_at": q.created_at.isoformat(),
        }
        for q in items
    ]
