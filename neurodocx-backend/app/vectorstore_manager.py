import os
import json
import faiss
import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer

_model: Optional[SentenceTransformer] = None
_index_cache: Dict[str, faiss.Index] = {}
_chunks_cache: Dict[str, List[Dict]] = {}


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        cache_dir = os.getenv("SENTENCE_TRANSFORMERS_HOME",
                              os.path.join(os.path.dirname(__file__), "..", "model_cache"))
        os.makedirs(cache_dir, exist_ok=True)
        _model = SentenceTransformer("all-MiniLM-L6-v2", cache_folder=cache_dir)
    return _model


def _load_store(store_path: str):
    """Load FAISS index and chunks into memory cache."""
    if store_path not in _index_cache:
        index_path = os.path.join(store_path, "index.faiss")
        chunks_path = os.path.join(store_path, "chunks.json")
        if not os.path.exists(index_path):
            return None, None
        _index_cache[store_path] = faiss.read_index(index_path)
        with open(chunks_path, "r", encoding="utf-8") as f:
            _chunks_cache[store_path] = json.load(f)
    return _index_cache[store_path], _chunks_cache[store_path]


def invalidate_cache(store_path: str):
    """Remove a store from cache (after rebuild)."""
    _index_cache.pop(store_path, None)
    _chunks_cache.pop(store_path, None)


def build_vectorstore(chunks: List[Dict], store_path: str):
    """Embed chunks and persist FAISS index + metadata."""
    model = get_model()
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False, batch_size=32, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype="float32")

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    os.makedirs(store_path, exist_ok=True)
    faiss.write_index(index, os.path.join(store_path, "index.faiss"))
    with open(os.path.join(store_path, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False)

    # Warm cache
    invalidate_cache(store_path)
    _index_cache[store_path] = index
    _chunks_cache[store_path] = chunks


def search_vectorstore(
    query: str,
    store_paths: List[str],
    top_k: int = 6,
    doc_names: Optional[Dict[str, str]] = None,
) -> List[Dict]:
    """
    Semantic search across one or multiple vectorstores.
    Returns top_k chunks sorted by relevance score.
    doc_names: {store_path: document_name} for citation enrichment.
    """
    model = get_model()
    query_emb = model.encode([query], normalize_embeddings=True)
    query_emb = np.array(query_emb, dtype="float32")

    all_results = []

    for store_path in store_paths:
        index, chunks = _load_store(store_path)
        if index is None or not chunks:
            continue

        k = min(top_k, index.ntotal)
        scores, indices = index.search(query_emb, k)

        doc_name = (doc_names or {}).get(store_path, "Document")

        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and float(score) > 0.05:  # low threshold — let LLM decide relevance
                chunk = chunks[idx].copy()
                chunk["score"] = float(score)
                chunk["store_path"] = store_path
                chunk["doc_name"] = doc_name
                all_results.append(chunk)

    all_results.sort(key=lambda x: x["score"], reverse=True)
    return all_results[:top_k]


def search_with_mmr(
    query: str,
    store_paths: List[str],
    top_k: int = 6,
    diversity: float = 0.3,
    doc_names: Optional[Dict[str, str]] = None,
) -> List[Dict]:
    """
    Maximal Marginal Relevance search for diverse, relevant results.
    Reduces redundant chunks from the same page.
    """
    candidates = search_vectorstore(query, store_paths, top_k=top_k * 3, doc_names=doc_names)
    if not candidates:
        return []

    model = get_model()
    candidate_texts = [c["text"] for c in candidates]
    candidate_embs = model.encode(candidate_texts, normalize_embeddings=True)
    query_emb = model.encode([query], normalize_embeddings=True)[0]

    selected_indices = []
    remaining = list(range(len(candidates)))

    for _ in range(min(top_k, len(candidates))):
        if not remaining:
            break
        if not selected_indices:
            # Pick highest relevance first
            best = max(remaining, key=lambda i: np.dot(candidate_embs[i], query_emb))
        else:
            # MMR: balance relevance vs diversity
            selected_embs = candidate_embs[selected_indices]
            scores = []
            for i in remaining:
                relevance = np.dot(candidate_embs[i], query_emb)
                redundancy = max(np.dot(candidate_embs[i], selected_embs[j]) for j in range(len(selected_indices)))
                mmr_score = (1 - diversity) * relevance - diversity * redundancy
                scores.append((i, mmr_score))
            best = max(scores, key=lambda x: x[1])[0]

        selected_indices.append(best)
        remaining.remove(best)

    return [candidates[i] for i in selected_indices]
