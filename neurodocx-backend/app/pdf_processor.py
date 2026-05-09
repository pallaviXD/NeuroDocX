import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os
import re
from typing import List, Dict, Tuple

# Tesseract path for Windows
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def clean_text(text: str) -> str:
    """Remove excessive whitespace and noise from extracted text."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {3,}', ' ', text)
    text = re.sub(r'[^\x00-\x7F\u00C0-\u024F\u0400-\u04FF]+', ' ', text)
    return text.strip()


def is_scanned_page(text: str) -> bool:
    """Detect if a page is image-based (scanned)."""
    return len(text.strip()) < 80


def extract_text_from_pdf(file_path: str) -> Tuple[List[Dict], bool]:
    """
    Extract text from PDF page by page with OCR fallback.
    Returns (pages_list, had_ocr_pages).
    Each page: {page_num, text, is_ocr, char_count}
    """
    pages = []
    had_ocr = False
    doc = fitz.open(file_path)

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text().strip()

        if is_scanned_page(text):
            # Try OCR
            try:
                pix = page.get_pixmap(dpi=250)
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                ocr_text = pytesseract.image_to_string(img, config='--psm 6').strip()
                if len(ocr_text) > len(text):
                    text = ocr_text
                    had_ocr = True
                    pages.append({
                        "page_num": page_num + 1,
                        "text": clean_text(text),
                        "is_ocr": True,
                        "char_count": len(text),
                    })
                    continue
            except Exception:
                pass

        pages.append({
            "page_num": page_num + 1,
            "text": clean_text(text),
            "is_ocr": False,
            "char_count": len(text),
        })

    doc.close()
    return pages, had_ocr


def chunk_pages(pages: List[Dict], chunk_size: int = 600, overlap: int = 80) -> List[Dict]:
    """
    Intelligent chunking: splits by sentences where possible,
    preserving page metadata for accurate citations.
    """
    chunks = []
    chunk_id = 0

    for page in pages:
        text = page["text"]
        if not text or len(text) < 30:
            continue

        # Split into sentences for cleaner chunks
        sentences = re.split(r'(?<=[.!?])\s+', text)
        current_chunk = []
        current_len = 0

        for sentence in sentences:
            words = sentence.split()
            if current_len + len(words) > chunk_size and current_chunk:
                chunk_text = " ".join(current_chunk)
                if len(chunk_text.strip()) > 30:
                    chunks.append({
                        "id": chunk_id,
                        "text": chunk_text,
                        "page_num": page["page_num"],
                        "is_ocr": page["is_ocr"],
                    })
                    chunk_id += 1
                # Keep overlap
                overlap_words = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_words + words
                current_len = len(current_chunk)
            else:
                current_chunk.extend(words)
                current_len += len(words)

        # Last chunk
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            if len(chunk_text.strip()) > 30:
                chunks.append({
                    "id": chunk_id,
                    "text": chunk_text,
                    "page_num": page["page_num"],
                    "is_ocr": page["is_ocr"],
                })
                chunk_id += 1

    return chunks


def get_page_count(file_path: str) -> int:
    doc = fitz.open(file_path)
    count = len(doc)
    doc.close()
    return count


def get_document_metadata(file_path: str) -> Dict:
    """Extract document metadata (title, author, subject)."""
    doc = fitz.open(file_path)
    meta = doc.metadata or {}
    doc.close()
    return {
        "title": meta.get("title", ""),
        "author": meta.get("author", ""),
        "subject": meta.get("subject", ""),
        "creator": meta.get("creator", ""),
    }
