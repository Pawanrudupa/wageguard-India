"""Retrieve relevant legal chunks and traceable citations from ChromaDB knowledge base."""

from pathlib import Path
from typing import Any

import chromadb
from chromadb.utils import embedding_functions

from backend.app.ml.data_pipeline import normalize_state_name

DEFAULT_INDEX_DIR = Path(__file__).resolve().parents[3] / "rag_store" / "index"
COLLECTION_NAME = "wageguard_legal_corpus"

# Multilingual / Hindi keyword expansion to bridge semantic search across languages
HINDI_KEYWORD_MAP: dict[str, list[str]] = {
    "वेतन": ["salary", "wages", "payment of wages"],
    "तनख्वाह": ["salary", "wages", "pay"],
    "इस्तीफा": ["resignation", "resign", "quitting job", "termination"],
    "त्यागपत्र": ["resignation", "termination", "separation"],
    "रोकना": ["delay", "withhold", "withheld", "final settlement"],
    "देरी": ["delay", "overdue", "late payment"],
    "कटौती": ["deduction", "salary cut", "unauthorized deduction", "fines"],
    "काट": ["deduction", "salary cut"],
    "न्यूनतम": ["minimum wages", "statutory minimum"],
    "ओवरटाइम": ["overtime", "extra hours", "double rate"],
    "अतिरिक्त समय": ["overtime", "extra work"],
    "काम के घंटे": ["working hours", "9 hours", "48 hours", "rest day"],
    "पीएफ": ["provident fund", "epfo", "epf contribution"],
    "भविष्य निधि": ["provident fund", "epfo"],
    "ग्रेच्युटी": ["gratuity", "5 years service", "retirement"],
    "उपदान": ["gratuity"],
    "शिकायत": ["grievance", "complaint", "shram suvidha", "labour commissioner"],
    "मुफ्त वकील": ["free legal aid", "nalsa", "legal services", "15100"],
    "कानूनी सहायता": ["free legal aid", "nalsa", "legal services"],
}


def enhance_query_multilingual(query: str) -> str:
    """Detect Hindi terms or devanagari script and append English contextual keywords."""
    expanded_terms: list[str] = [query]
    clean_query = query.strip()

    for hi_term, en_synonyms in HINDI_KEYWORD_MAP.items():
        if hi_term in clean_query:
            expanded_terms.extend(en_synonyms)

    # Return concatenated search string
    return " ".join(dict.fromkeys(expanded_terms))


from backend.app.rag.ingest import get_embedding_function


def get_retrieval_collection(index_dir: Path | None = None) -> Any:
    """Connect to the persistent ChromaDB collection."""
    if index_dir is None:
        index_dir = DEFAULT_INDEX_DIR

    client = chromadb.PersistentClient(path=str(index_dir))
    embedding_fn = get_embedding_function()
    return client.get_collection(name=COLLECTION_NAME, embedding_function=embedding_fn)


def retrieve_chunks(
    query: str,
    state: str | None = None,
    top_k: int = 4,
    score_threshold: float = 0.25,
    index_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """Retrieve top-k relevant chunks with full traceable metadata from ChromaDB.

    Args:
        query: User question in English, Hindi, or Hinglish.
        state: Optional target state (e.g. 'Delhi', 'Maharashtra').
        top_k: Number of chunks to return.
        score_threshold: Minimum similarity threshold (0.0 to 1.0).
        index_dir: Optional custom index directory.

    Returns:
        List of dicts with keys: 'id', 'text', 'similarity', 'metadata'.
    """
    collection = get_retrieval_collection(index_dir=index_dir)

    enhanced_query = enhance_query_multilingual(query)
    search_query = f"{enhanced_query} {state}" if state else enhanced_query
    fetch_k = min(top_k * 4, 30)

    results = collection.query(
        query_texts=[search_query],
        n_results=fetch_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    ids = results.get("ids", [[]])[0]

    normalized_target_state = normalize_state_name(state) if state else ""

    scored_chunks: list[dict[str, Any]] = []
    for doc_id, doc_text, meta, dist in zip(ids, documents, metadatas, distances):
        # In cosine distance space, similarity is 1.0 - distance
        raw_sim = max(0.0, 1.0 - float(dist))

        # Check state relevance
        chunk_state = meta.get("state", "")
        norm_chunk_state = normalize_state_name(chunk_state) if chunk_state else ""

        state_boost = 0.0
        if normalized_target_state:
            if norm_chunk_state == normalized_target_state:
                state_boost = 0.15  # Boost exact state schedule match
            elif norm_chunk_state != "" and norm_chunk_state != normalized_target_state:
                # Different state schedule: penalty unless general act
                state_boost = -0.20

        final_score = raw_sim + state_boost

        if raw_sim >= score_threshold:
            scored_chunks.append({
                "id": doc_id,
                "text": doc_text,
                "similarity": round(raw_sim, 4),
                "ranking_score": round(final_score, 4),
                "metadata": {
                    "source_file": meta.get("source_file", ""),
                    "act_name": meta.get("act_name", ""),
                    "section_or_clause": meta.get("section_or_clause", ""),
                    "section_title": meta.get("section_title", ""),
                    "state": meta.get("state", ""),
                    "valid_as_of_date": meta.get("valid_as_of_date", ""),
                },
            })

    # Sort descending by ranking_score
    scored_chunks.sort(key=lambda x: x["ranking_score"], reverse=True)
    return scored_chunks[:top_k]


if __name__ == "__main__":
    test_q = "can my employer delay my final salary after I resign?"
    chunks = retrieve_chunks(test_q, top_k=3)
    print(f"Query: {test_q}\nRetrieved {len(chunks)} chunks:")
    for idx, c in enumerate(chunks, 1):
        m = c["metadata"]
        print(f"[{idx}] {m['act_name']} - {m['section_or_clause']} (Sim: {c['similarity']})")
        print(f"    Source: {m['source_file']}")
        print(f"    Snippet: {c['text'][:140]}...\n")
