from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db, User, Document, ChatSession, Message, QuizResult, Summary, Note, Analytics
from ..auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id

    doc_count = db.query(Document).filter(Document.user_id == uid).count()
    session_count = db.query(ChatSession).filter(ChatSession.user_id == uid).count()
    msg_count = (
        db.query(Message)
        .join(ChatSession, Message.session_id == ChatSession.id)
        .filter(ChatSession.user_id == uid)
        .count()
    )
    quiz_count = db.query(QuizResult).filter(QuizResult.user_id == uid).count()
    notes_count = db.query(Note).filter(Note.user_id == uid).count()
    summary_count = db.query(Summary).filter(Summary.user_id == uid).count()

    total_tokens = (
        db.query(func.sum(Analytics.tokens_used))
        .filter(Analytics.user_id == uid)
        .scalar() or 0
    )

    # Recent documents
    recent_docs = (
        db.query(Document)
        .filter(Document.user_id == uid)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )

    # Recent sessions
    recent_sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == uid)
        .order_by(ChatSession.created_at.desc())
        .limit(5)
        .all()
    )

    # Quiz performance
    quiz_scores = (
        db.query(QuizResult.score)
        .filter(QuizResult.user_id == uid, QuizResult.score.isnot(None))
        .all()
    )
    avg_score = round(sum(s[0] for s in quiz_scores) / len(quiz_scores) * 100, 1) if quiz_scores else None

    return {
        "stats": {
            "documents": doc_count,
            "conversations": session_count,
            "messages": msg_count,
            "quizzes": quiz_count,
            "notes": notes_count,
            "summaries": summary_count,
            "total_tokens": total_tokens,
        },
        "quiz_avg_score": avg_score,
        "recent_documents": [
            {
                "id": d.id,
                "name": d.original_name,
                "pages": d.pages,
                "size": d.file_size,
                "has_ocr": d.has_ocr,
                "created_at": d.created_at.isoformat(),
            }
            for d in recent_docs
        ],
        "recent_sessions": [
            {
                "id": s.id,
                "title": s.title,
                "message_count": len(s.messages),
                "created_at": s.created_at.isoformat(),
            }
            for s in recent_sessions
        ],
    }
