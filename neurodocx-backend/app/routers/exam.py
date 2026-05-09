import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..database import get_db, User, QuizResult, Document
from ..auth import get_current_user
from ..rag import _call_groq, build_context
from ..vectorstore_manager import search_vectorstore

router = APIRouter(prefix="/exam", tags=["exam"])


class ExamReportRequest(BaseModel):
    doc_ids: List[str]
    subject: str = ""
    exam_type: str = "general"  # general, mcq, descriptive, mixed


class StudyPlanRequest(BaseModel):
    doc_ids: List[str]
    exam_date: str = ""
    weak_topics: List[str] = []


def _get_store_info(doc_ids, user_id, db):
    paths, names = [], {}
    for doc_id in doc_ids:
        doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == user_id).first()
        if doc and doc.vectorstore_path:
            paths.append(doc.vectorstore_path)
            names[doc.vectorstore_path] = doc.original_name
    return paths, names


@router.post("/report")
def generate_exam_report(
    req: ExamReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if not store_paths:
        raise HTTPException(status_code=400, detail="No valid documents found.")

    # Get quiz history for this user
    quiz_history = db.query(QuizResult).filter(
        QuizResult.user_id == current_user.id
    ).order_by(QuizResult.created_at.desc()).limit(10).all()

    # Build performance data
    scores = [q.score for q in quiz_history if q.score is not None]
    avg_score = round(sum(scores) / len(scores) * 100, 1) if scores else None
    total_quizzes = len(quiz_history)

    # Get document content for topic analysis
    chunks = search_vectorstore(
        "main topics chapters concepts important exam questions",
        store_paths, top_k=12, doc_names=doc_names
    )
    context = build_context(chunks)

    subject_line = f"Subject/Topic: {req.subject}" if req.subject else ""
    score_line = f"Student's average quiz score: {avg_score}%" if avg_score else "No quiz attempts yet."
    quizzes_line = f"Total quizzes taken: {total_quizzes}"

    result = _call_groq([
        {"role": "system", "content": "You are an expert academic advisor and exam preparation specialist. Write in plain text only — no markdown symbols like #, *, or **. Use CAPITALS for section headings and numbered lists for items."},
        {"role": "user", "content": f"""Based on this document content:
{context}

Student Performance Data:
{score_line}
{quizzes_line}
{subject_line}
Exam type: {req.exam_type}

Generate a comprehensive exam preparation report in plain text. Structure it as follows:

DOCUMENT OVERVIEW
Brief summary of what this document covers and its exam relevance.

IMPORTANT TOPICS FOR EXAM
Numbered list of the most exam-important topics from this document with page references.

HIGH PRIORITY AREAS (Must Study)
Topics that are most likely to appear in exams based on the document content.

MEDIUM PRIORITY AREAS (Should Study)
Important but secondary topics.

LOWER PRIORITY AREAS (Good to Know)
Supporting concepts worth reviewing if time permits.

PERFORMANCE ANALYSIS
{f"Based on the student's average score of {avg_score}%, provide specific feedback on strengths and areas needing improvement." if avg_score else "No quiz data available yet. Recommend taking practice quizzes to assess performance."}

WHERE TO CONCENTRATE MORE
Specific advice on which sections of the document need the most attention and why.

STUDY RECOMMENDATIONS
1. Numbered list of specific, actionable study strategies for this document
2. Include time allocation suggestions
3. Include memory techniques relevant to this content

PREDICTED EXAM QUESTIONS
5 likely exam questions based on the document content with brief answer hints.

QUICK REVISION CHECKLIST
Numbered checklist of key points to verify before the exam.

Key Insight: [Most important advice for exam success with this material]"""},
    ], temperature=0.4, max_tokens=2500)

    return {
        "report": result["content"],
        "avg_score": avg_score,
        "total_quizzes": total_quizzes,
        "doc_names": list(doc_names.values()),
    }


@router.post("/study-plan")
def generate_study_plan(
    req: StudyPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    store_paths, doc_names = _get_store_info(req.doc_ids, current_user.id, db)
    if not store_paths:
        raise HTTPException(status_code=400, detail="No valid documents found.")

    chunks = search_vectorstore(
        "topics chapters sections overview", store_paths, top_k=10, doc_names=doc_names
    )
    context = build_context(chunks)

    weak = ", ".join(req.weak_topics) if req.weak_topics else "not specified"
    exam_date = f"Exam date: {req.exam_date}" if req.exam_date else "Exam date: not specified"

    result = _call_groq([
        {"role": "system", "content": "You are an expert study planner. Write in plain text only — no markdown. Use CAPITALS for headings and numbered lists."},
        {"role": "user", "content": f"""Document content:
{context}

{exam_date}
Weak topics identified: {weak}

Create a detailed, personalized study plan in plain text:

PERSONALIZED STUDY PLAN

WEEK-BY-WEEK BREAKDOWN
Numbered list of what to study each week leading up to the exam.

DAILY STUDY SCHEDULE TEMPLATE
A practical daily routine for exam preparation.

WEAK AREAS ACTION PLAN
Specific strategies to improve in: {weak}

REVISION STRATEGY
How to revise effectively in the final days before the exam.

PRACTICE TEST SCHEDULE
When and how to take practice tests for maximum benefit.

Key Insight: [The single most important study tip for this material]"""},
    ], temperature=0.4, max_tokens=1500)

    return {"plan": result["content"]}


@router.get("/progress")
def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quizzes = db.query(QuizResult).filter(
        QuizResult.user_id == current_user.id
    ).order_by(QuizResult.created_at).all()

    if not quizzes:
        return {"progress": [], "summary": None}

    progress = []
    for i, q in enumerate(quizzes):
        progress.append({
            "attempt": i + 1,
            "score": round((q.score or 0) * 100, 1),
            "difficulty": q.difficulty,
            "total_questions": q.total_questions,
            "created_at": q.created_at.isoformat(),
        })

    scores = [p["score"] for p in progress if p["score"] > 0]
    trend = "improving" if len(scores) >= 2 and scores[-1] > scores[0] else \
            "declining" if len(scores) >= 2 and scores[-1] < scores[0] else "stable"

    return {
        "progress": progress,
        "summary": {
            "total_attempts": len(quizzes),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "best_score": max(scores) if scores else 0,
            "latest_score": scores[-1] if scores else 0,
            "trend": trend,
        }
    }
