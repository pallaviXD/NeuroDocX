import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db, Document, User, Analytics
from ..auth import get_current_user
from ..pdf_processor import extract_text_from_pdf, chunk_pages, get_page_count, get_document_metadata
from ..vectorstore_manager import build_vectorstore, invalidate_cache

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads"
VECTOR_DIR = "vectorstore"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

    doc_id = str(uuid.uuid4())
    safe_name = f"{doc_id}.pdf"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(content)

    file_size = len(content)

    try:
        pages, had_ocr = extract_text_from_pdf(file_path)
        chunks = chunk_pages(pages)

        if not chunks:
            os.remove(file_path)
            raise HTTPException(status_code=422, detail="Could not extract text from this PDF. It may be corrupted or password-protected.")

        page_count = get_page_count(file_path)
        store_path = os.path.join(VECTOR_DIR, doc_id)
        build_vectorstore(chunks, store_path)

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

    doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=safe_name,
        original_name=file.filename,
        pages=page_count,
        file_size=file_size,
        vectorstore_path=store_path,
        has_ocr=had_ocr,
        chunk_count=len(chunks),
    )
    db.add(doc)

    # Track analytics
    db.add(Analytics(user_id=current_user.id, event_type="upload", doc_id=doc_id))
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "name": doc.original_name,
        "pages": doc.pages,
        "size": doc.file_size,
        "has_ocr": doc.has_ocr,
        "chunk_count": doc.chunk_count,
        "created_at": doc.created_at.isoformat(),
    }


@router.get("/")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "name": d.original_name,
            "pages": d.pages,
            "size": d.file_size,
            "has_ocr": d.has_ocr,
            "chunk_count": d.chunk_count,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == doc_id, Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = os.path.join(UPLOAD_DIR, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    if doc.vectorstore_path and os.path.exists(doc.vectorstore_path):
        shutil.rmtree(doc.vectorstore_path, ignore_errors=True)
        invalidate_cache(doc.vectorstore_path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
