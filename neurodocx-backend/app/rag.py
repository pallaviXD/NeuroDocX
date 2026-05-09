import os
import json
from typing import List, Dict, Optional
from groq import Groq
from .vectorstore_manager import search_with_mmr, search_vectorstore

def get_groq_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are NeuroDocX, an elite AI document intelligence system — a senior research analyst, expert consultant, and academic advisor combined.

CORE IDENTITY:
- You have deeply read and understood every page of the uploaded documents
- You provide responses at the level of a domain expert, not a generic chatbot
- You think critically, connect ideas across sections, and surface non-obvious insights

CRITICAL FORMATTING RULES — READ CAREFULLY:
- DO NOT use markdown symbols like #, ##, ###, **, *, __, or ``` in your responses
- DO NOT use bullet points with - or * symbols
- Use plain numbered lists like: 1. 2. 3. when listing items
- Use CAPITAL LETTERS for section headings instead of # symbols
- Use plain text throughout — write like a professional human expert, not a markdown document
- Separate sections with a blank line
- Bold important terms by writing them in CAPITALS or quoting them, not with ** symbols
- Write in a natural, flowing, professional tone — like a knowledgeable colleague explaining something

RESPONSE QUALITY STANDARDS:
1. DEPTH: Never give surface-level answers. Dig into the why and how, not just the what
2. STRUCTURE: Use numbered lists and clear paragraph breaks for readability
3. CITATIONS: Cite page numbers inline throughout — e.g. (Page 3), (Pages 5-7)
4. LENGTH: Match depth to question complexity. Simple questions get focused answers. Complex questions get thorough analysis
5. INSIGHT: Go beyond restating the document — synthesize, analyze, and highlight implications
6. PRECISION: Use exact terminology from the document. Quote key phrases when relevant
7. HONESTY: If something is not in the documents, say so clearly and tell the user what IS available

DOMAIN ADAPTATION:
- Technical/Engineering docs: precise terminology, architecture details, implementation specifics
- Business/Strategy docs: strategic implications, competitive analysis, actionable recommendations
- Academic/Research docs: methodology critique, statistical findings, research gaps
- Legal docs: clause analysis, obligations, risks, plain-language explanations
- Educational docs: concept breakdown, examples, learning objectives, exam-relevant points

End substantive answers with: Key Insight: [one powerful takeaway in plain text]
For voice queries: keep the first paragraph conversational and clear"""

EXPLAIN_MODES = {
    "standard": "",
    "beginner": "Use simple, easy-to-understand language. Avoid jargon. Explain step by step.",
    "technical": "Use precise technical language. Include relevant details, formulas, and terminology.",
    "business": "Focus on business implications, ROI, key takeaways, and actionable insights.",
    "eli5": "Explain like I'm 10 years old. Use simple words, analogies, and fun examples.",
}

QUIZ_TYPES = {
    "mcq": "Multiple Choice Questions (4 options each)",
    "truefalse": "True/False questions",
    "fillinblank": "Fill in the blank questions",
    "descriptive": "Short descriptive questions",
    "mixed": "Mix of MCQ, True/False, and Fill in the blank",
}

DIFFICULTY_PROMPTS = {
    "easy": "Focus on basic facts and definitions. Keep questions straightforward.",
    "medium": "Include conceptual questions and application-based scenarios.",
    "hard": "Include analytical, critical thinking, and synthesis questions.",
}


def build_context(chunks: List[Dict]) -> str:
    parts = []
    for chunk in chunks:
        doc_label = f" | {chunk.get('doc_name', '')}" if chunk.get('doc_name') else ""
        parts.append(f"[Page {chunk['page_num']}{doc_label}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def format_sources(chunks: List[Dict]) -> List[Dict]:
    seen = set()
    sources = []
    for chunk in chunks:
        key = (chunk["page_num"], chunk.get("doc_name", ""))
        if key not in seen:
            seen.add(key)
            sources.append({
                "page": chunk["page_num"],
                "doc_name": chunk.get("doc_name", "Document"),
                "excerpt": chunk["text"][:250] + "..." if len(chunk["text"]) > 250 else chunk["text"],
                "score": round(chunk.get("score", 0), 3),
                "is_ocr": chunk.get("is_ocr", False),
            })
    return sources


def _call_groq(messages: List[Dict], temperature: float = 0.3, max_tokens: int = 1024) -> Dict:
    response = get_groq_client().chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return {
        "content": response.choices[0].message.content,
        "model": response.model,
        "tokens": response.usage.total_tokens,
    }


def _expand_query(query: str) -> str:
    """Expand short/vague queries to improve retrieval."""
    q = query.lower().strip()
    # Map common vague queries to richer search terms
    expansions = {
        "analyze": "analysis overview summary main points key findings",
        "analyse": "analysis overview summary main points key findings",
        "summarize": "summary overview main topics key points introduction conclusion",
        "summary": "summary overview main topics key points introduction conclusion",
        "explain": "explanation definition concept meaning how why",
        "what is this": "overview introduction purpose main topic subject",
        "tell me about": "overview description details information",
        "key points": "key points main findings important conclusions highlights",
        "overview": "overview introduction summary main topics purpose",
        "findings": "findings results conclusions outcomes data",
        "methodology": "methodology method approach process steps procedure",
        "conclusion": "conclusion summary findings recommendations outcome",
    }
    for trigger, expansion in expansions.items():
        if trigger in q:
            return f"{query} {expansion}"
    # For very short queries (< 4 words), add generic expansion
    if len(query.split()) < 4:
        return f"{query} overview summary main points details information"
    return query


def chat_with_docs(
    query: str,
    store_paths: List[str],
    chat_history: List[Dict],
    explain_mode: str = "standard",
    doc_names: Optional[Dict[str, str]] = None,
) -> Dict:
    """Full RAG pipeline with MMR retrieval and conversation memory."""

    # Detect comparison/multi-doc queries
    is_comparison = any(w in query.lower() for w in ["compare", "difference", "vs", "versus", "contrast", "both"])

    # Expand query for better retrieval
    search_query = _expand_query(query)

    chunks = search_with_mmr(
        query=search_query,
        store_paths=store_paths,
        top_k=8 if is_comparison else 7,
        diversity=0.4 if is_comparison else 0.35,
        doc_names=doc_names,
    )

    if not chunks:
        # Last resort: grab top chunks without threshold
        from .vectorstore_manager import search_vectorstore as _sv
        chunks = _sv(search_query, store_paths, top_k=5, doc_names=doc_names)

    if not chunks:
        return {
            "answer": "I wasn't able to find relevant content in the uploaded documents for this query. This could mean:\n\n- The document may not contain information on this specific topic\n- Try rephrasing your question with different keywords\n- Make sure the correct document is selected in the sidebar\n\nWhat I can help you with: summarizing the document, explaining specific sections, generating quiz questions, or answering questions about the document's content.",
            "sources": [],
            "tokens_used": 0,
        }

    context = build_context(chunks)
    sources = format_sources(chunks)

    mode_instruction = EXPLAIN_MODES.get(explain_mode, "")
    system = SYSTEM_PROMPT
    if mode_instruction:
        system += f"\n\nEXPLAIN MODE: {mode_instruction}"
    if is_comparison and len(store_paths) > 1:
        system += "\n\nThis is a MULTI-DOCUMENT COMPARISON query. Structure your answer to clearly compare both documents."

    messages = [{"role": "system", "content": system}]

    # Inject last 8 messages for memory
    for msg in chat_history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    user_content = f"""DOCUMENT CONTEXT (retrieved from uploaded PDFs):
{context}

USER QUESTION: {query}

INSTRUCTIONS FOR THIS RESPONSE:
- Answer as a domain expert who has thoroughly read this document
- Use plain text only — NO markdown symbols (#, *, **, ##, ---)
- Use numbered lists (1. 2. 3.) for listing items
- Use CAPITALS for section headings
- Cite page numbers inline throughout: (Page X) or (Pages X-Y)
- For vague/open questions like "analyze this": provide a comprehensive overview covering purpose, key topics, main findings, and significance
- Include specific details, data points, and quotes from the document where relevant
- Synthesize information — explain significance, not just facts
- End with: Key Insight: [the single most valuable takeaway in plain text]"""

    messages.append({"role": "user", "content": user_content})

    result = _call_groq(messages, temperature=0.3, max_tokens=2000)

    return {
        "answer": result["content"],
        "sources": sources,
        "model": result["model"],
        "tokens_used": result["tokens"],
    }


def generate_summary(
    store_paths: List[str],
    style: str = "detailed",
    doc_names: Optional[Dict[str, str]] = None,
) -> str:
    chunks = search_vectorstore(
        "main topics key findings summary overview introduction conclusion abstract",
        store_paths,
        top_k=10,
        doc_names=doc_names,
    )
    if not chunks:
        return "No content found to summarize."

    context = build_context(chunks)

    style_prompts = {
        "short": "Write a concise but complete executive summary (5-8 sentences) covering: main topic, key findings, methodology (if applicable), and conclusion. Use professional language.",
        "detailed": """Write a comprehensive, professionally structured summary with the following sections:
## 📋 Overview
Brief description of the document's purpose and scope.

## 🔑 Key Topics Covered
Bullet-point list of all major topics with brief explanations.

## 📊 Main Findings / Arguments
Detailed breakdown of the core content, findings, or arguments.

## 🔬 Methodology / Approach (if applicable)
How the work was conducted or structured.

## ✅ Conclusions & Recommendations
What the document concludes and any recommendations made.

## 💡 Key Takeaway
The single most important insight from this document.

Include page references throughout.""",
        "bullets": """Create a structured bullet-point summary:

**Main Topic:** [one line]

**Key Points:**
• [point with page ref]
• [point with page ref]
...

**Important Facts & Figures:**
• [specific data points]

**Conclusions:**
• [conclusion points]

**Action Items / Recommendations (if any):**
• [actionable items]""",
        "beginner": "Write a friendly, easy-to-understand summary as if explaining to someone with no background in this topic. Use simple language, real-world analogies, and avoid jargon. Break it into short paragraphs. Start with 'This document is about...'",
        "technical": """Write a technical summary for domain experts:
- Use precise technical terminology
- Include specific metrics, formulas, algorithms, or methodologies mentioned
- Reference exact page numbers for all technical claims
- Highlight technical innovations, limitations, and implications
- Include any quantitative results or performance metrics""",
    }

    prompt = style_prompts.get(style, style_prompts["detailed"])
    result = _call_groq([
        {"role": "system", "content": "You are an expert document summarizer producing professional, publication-quality summaries. Always cite page numbers. Use plain text only — no markdown symbols like #, *, or **."},
        {"role": "user", "content": f"Document content:\n{context}\n\nTask: {prompt}\n\nIMPORTANT: Use plain text only. No # symbols, no ** bold, no markdown. Use CAPITALS for headings and numbered lists for items."},
    ], temperature=0.3, max_tokens=1500)
    return result["content"]


def generate_quiz(
    store_paths: List[str],
    num_questions: int = 5,
    difficulty: str = "medium",
    quiz_type: str = "mcq",
    doc_names: Optional[Dict[str, str]] = None,
) -> Dict:
    chunks = search_vectorstore(
        "important concepts facts definitions key information principles",
        store_paths,
        top_k=10,
        doc_names=doc_names,
    )
    if not chunks:
        return {"quiz": "No content found.", "questions": []}

    context = build_context(chunks)
    type_desc = QUIZ_TYPES.get(quiz_type, QUIZ_TYPES["mcq"])
    diff_desc = DIFFICULTY_PROMPTS.get(difficulty, DIFFICULTY_PROMPTS["medium"])

    prompt = f"""Based on this document content:
{context}

Create exactly {num_questions} {type_desc} questions.
Difficulty level: {diff_desc}

QUALITY REQUIREMENTS:
- Questions must be specific to the document content, not generic
- Each question should test genuine understanding, not just memorization
- Include page references where the answer can be found
- Explanations must be detailed and educational (2-3 sentences minimum)
- For MCQ: make all 4 options plausible — avoid obviously wrong distractors

Format STRICTLY as JSON array:
[
  {{
    "question": "Specific question text based on document content",
    "type": "{quiz_type}",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "answer": "A",
    "explanation": "Detailed explanation of why this is correct and what the concept means (Page X)",
    "page_ref": 1,
    "topic": "Topic/concept being tested"
  }}
]

For true/false: options = ["True", "False"], answer = "True" or "False"
For fill-in-blank: use ___ in question text, options = [], answer = "exact word or phrase"
Return ONLY the JSON array, no markdown, no other text."""

    result = _call_groq([
        {"role": "system", "content": "You are an expert educator creating high-quality assessment questions. Return only valid JSON with no markdown formatting."},
        {"role": "user", "content": prompt},
    ], temperature=0.4, max_tokens=2000)

    raw = result["content"].strip()
    # Extract JSON array
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            questions = json.loads(raw[start:end])
        else:
            questions = []
    except Exception:
        questions = []

    return {
        "quiz": raw,
        "questions": questions,
        "difficulty": difficulty,
        "type": quiz_type,
        "total": len(questions),
    }


def generate_notes(
    store_paths: List[str],
    doc_names: Optional[Dict[str, str]] = None,
) -> str:
    chunks = search_vectorstore(
        "key concepts definitions important points main ideas principles methods",
        store_paths,
        top_k=10,
        doc_names=doc_names,
    )
    if not chunks:
        return "No content found."

    context = build_context(chunks)
    result = _call_groq([
        {"role": "system", "content": "You are an expert study notes creator. Use plain text only — no markdown symbols. Use CAPITALS for headings, numbered lists for items."},
        {"role": "user", "content": f"""Based on this document:
{context}

Create comprehensive, professional study notes. Use plain text only — no # symbols, no ** bold markers.

LEARNING OBJECTIVES
What you will understand after studying this document.

KEY CONCEPTS AND DEFINITIONS
For each major concept: write the concept name in CAPITALS followed by its definition and explanation with page reference.

IMPORTANT POINTS TO REMEMBER
Use numbered list: 1. 2. 3. for critical facts, key figures, and important relationships.

CORE THEORIES, FRAMEWORKS AND METHODS
Detailed explanation of any frameworks, models, or methodologies presented.

QUICK REFERENCE SUMMARY
A condensed numbered list of the most important facts for quick review.

PRACTICE QUESTIONS
3 to 5 self-test questions to check understanding.

KEY TAKEAWAYS
The 3 most important things to remember from this document."""},
    ], temperature=0.3, max_tokens=1800)
    return result["content"]


def compare_documents(
    store_paths: List[str],
    doc_names: Optional[Dict[str, str]] = None,
) -> str:
    """Generate a structured comparison across multiple documents."""
    if len(store_paths) < 2:
        return "Please select at least 2 documents to compare."

    chunks = search_vectorstore(
        "main topic methodology findings conclusions results approach",
        store_paths,
        top_k=12,
        doc_names=doc_names,
    )
    if not chunks:
        return "No content found for comparison."

    context = build_context(chunks)
    doc_list = list((doc_names or {}).values()) or ["Document 1", "Document 2"]

    result = _call_groq([
        {"role": "system", "content": "You are an expert document analyst specializing in comparative analysis. Produce detailed, professional comparisons."},
        {"role": "user", "content": f"""Compare these documents: {', '.join(doc_list)}

Content:
{context}

Provide a thorough professional comparison:

## 📋 Document Overview
Brief description of each document's purpose, scope, and target audience.

## 🤝 Key Similarities
What concepts, approaches, or findings they share in common (with page refs).

## ⚖️ Key Differences
| Aspect | {doc_list[0] if doc_list else 'Doc 1'} | {doc_list[1] if len(doc_list) > 1 else 'Doc 2'} |
|--------|---------|---------|
| [aspect] | [detail] | [detail] |

## 🌟 Unique Contributions
What each document uniquely offers that the other doesn't.

## 📊 Methodology / Approach Comparison
How each document approaches its subject matter differently.

## ✅ Strengths & Limitations
Honest assessment of each document's strengths and weaknesses.

## 🎯 Recommendation
Which document is more suitable for which purpose or audience.

## 💡 Combined Insights
What insights emerge when both documents are considered together."""},
    ], temperature=0.3, max_tokens=2000)
    return result["content"]


def evaluate_quiz_answer(question: str, user_answer: str, correct_answer: str, explanation: str) -> Dict:
    """AI-powered answer evaluation with feedback."""
    is_correct = user_answer.strip().lower() == correct_answer.strip().lower()

    if is_correct:
        return {"correct": True, "score": 1.0, "feedback": f"✅ Correct! {explanation}"}

    result = _call_groq([
        {"role": "system", "content": "You are a helpful tutor providing constructive feedback."},
        {"role": "user", "content": f"""Question: {question}
Student answered: {user_answer}
Correct answer: {correct_answer}
Explanation: {explanation}

Provide brief, encouraging feedback (2-3 sentences) explaining why the correct answer is right."""},
    ], temperature=0.4, max_tokens=150)

    return {
        "correct": False,
        "score": 0.0,
        "feedback": f"❌ {result['content']}",
    }

